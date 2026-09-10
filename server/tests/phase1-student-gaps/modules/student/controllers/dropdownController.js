// modules/student/controllers/dropdownController.js
// Ported from kuc-backend-main/controllers/dropdownController.mjs (ESM -> CommonJS).
// Logic is unchanged from the original so response shape stays identical
// to what the Student frontend already expects.

const Dropdown = require('../models/Dropdown');

const getDropdowns = async (req, res) => {
  try {
    const dropdown = await Dropdown.findOne().lean();

    if (!dropdown) {
      return res.status(404).json({
        success: false,
        message: 'Dropdown data not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: dropdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const addDropdownValues = async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty.'
      });
    }

    let dropdown = await Dropdown.findOne();

    if (!dropdown) {
      dropdown = await Dropdown.create({});
    }

    const dropdownObject = dropdown.toObject();

    for (const [key, values] of Object.entries(updates)) {
      if (!(key in dropdownObject)) {
        return res.status(400).json({
          success: false,
          message: `Invalid dropdown key: ${key}`
        });
      }

      // Handle states separately
      if (key === 'states') {
        for (const [state, districts] of Object.entries(values)) {
          const existingDistricts = dropdown.states.get(state) || [];

          const incomingDistricts = (Array.isArray(districts) ? districts : [districts])
            .map((d) => String(d).trim())
            .filter(Boolean);

          const merged = [...new Set([...existingDistricts, ...incomingDistricts])].sort();

          dropdown.states.set(state, merged);
        }

        continue;
      }

      // Normal dropdown arrays
      const incoming = (Array.isArray(values) ? values : [values])
        .map((v) => String(v).trim())
        .filter(Boolean);

      const existing = (dropdown[key] || []).map((v) => String(v).trim());

      dropdown[key] = [...new Set([...existing, ...incoming])].sort();
    }

    await dropdown.save();

    res.status(200).json({
      success: true,
      message: 'Dropdown values updated successfully.',
      data: dropdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteDropdownValues = async (req, res) => {
  try {
    const updates = req.body;

    const dropdown = await Dropdown.findOne();

    if (!dropdown) {
      return res.status(404).json({
        success: false,
        message: 'Dropdown document not found.'
      });
    }

    const dropdownObject = dropdown.toObject();

    for (const [key, values] of Object.entries(updates)) {
      if (!(key in dropdownObject)) {
        return res.status(400).json({
          success: false,
          message: `Invalid dropdown key: ${key}`
        });
      }

      // Handle states separately
      if (key === 'states') {
        for (const [state, districts] of Object.entries(values)) {
          if (!dropdown.states.has(state)) continue;

          const existingDistricts = dropdown.states.get(state);

          const updated = existingDistricts.filter(
            (district) => !(Array.isArray(districts) ? districts : [districts]).includes(district)
          );

          if (updated.length === 0) {
            dropdown.states.delete(state);
          } else {
            dropdown.states.set(state, updated);
          }
        }

        continue;
      }

      // Normal dropdown arrays
      const removeValues = Array.isArray(values) ? values : [values];

      dropdown[key] = (dropdown[key] || []).filter((item) => !removeValues.includes(item));
    }

    await dropdown.save();

    res.status(200).json({
      success: true,
      message: 'Dropdown values deleted successfully.',
      data: dropdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const initializeDropdowns = async (req, res) => {
  try {
    // Allow only one dropdown document
    const existing = await Dropdown.findOne();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Dropdowns are already initialized.'
      });
    }

    const dropdown = await Dropdown.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Dropdowns initialized successfully.',
      data: dropdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getDropdowns, addDropdownValues, deleteDropdownValues, initializeDropdowns };
