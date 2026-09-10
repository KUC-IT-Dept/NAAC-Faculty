import Users from "../models/users.mjs";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { sendOTP } from "../utils/sendEmail.mjs";
import StudentProfile from "../models/studentProfile.mjs";

export const register = async (req, res) => {
  try {
    const data = req.body;

    const existingUser = await Users.findOne({
      $or: [
        { email: data.email },
        { phone: data.phone }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

        // SECURITY: role is never taken from client input on public registration.
        // Public /register always creates a plain "student" account. Elevated
        // roles must be created through an authenticated+authorized admin path.
        const user = await Users.create({
  name: data.name,
  email: data.email,
  phone: data.phone,
  password: hashedPassword,
  role: "student",
  mustChangePassword: true,
  canEdit: true
});

    // Create Student Profile
  await StudentProfile.create({
  userId: user._id,

  fullUnlockActive: true,

  academic_details: {
    department: data.department
  },

  personal_details: {
    fullName: data.name
  },

  contact_details: {
    personalEmail: data.email,
    personalMobile: {
      number: data.phone
    }
  },

  mentor_details: {
    hodName: data.hodName,
    hodEmail: data.hodEmail,
    tutorName: data.tutorName,
    tutorEmail: data.tutorEmail
  }
});
    return res.status(201).json({
      message: "User registration complete",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
           mustChangePassword:
      user.mustChangePassword
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};


export const login = async (req, res) => {
    try {
        console.log(req.body);  
        const { email, password } = req.body;

        // Find user
        const user = await Users.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Wrong password"
            });
        }

        // Generate token
        const token = jwt.sign(
            {
                _id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Success response
        return res.status(200).json({
  success: true,
  message: "Login successful",
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    canEdit: user.canEdit,
    mustChangePassword: user.mustChangePassword,
  },
});

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


export const ResetPassword = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(400).json({ "message": "sorry user does not exist" });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ "message": "Missing fields" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ "message": "Wrong current password" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ "message": "Password mismatch" });
        }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

user.password = hashedPassword;

// Password has been changed, so don't force it again
user.mustChangePassword = false;

await user.save();

return res.status(200).json({
  success: true,
  message: "Password changed successfully",
  mustChangePassword: false,
});

    } catch (error) {
        return res.status(500).json({ "message": "Internel server error" })
    }
}

export const changePassword = async (req, res) => {
    try {
        const { token, currentPassword, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await Users.findById(decoded._id).select("+password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password" });
        }

       const hashedPassword = await bcrypt.hash(newPassword, 10);

user.password = hashedPassword;

// Password has been changed
user.mustChangePassword = false;

await user.save();

// Verify it was saved
const updatedUser = await Users.findById(user._id);

console.log("mustChangePassword:", updatedUser.mustChangePassword);

return res.status(200).json({
    success: true,
    message: "Password changed successfully",
    mustChangePassword: updatedUser.mustChangePassword,
});
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
