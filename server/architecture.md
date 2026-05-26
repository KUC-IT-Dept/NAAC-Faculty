Analyze this entire workspace as ONE unified backend system.

The projects are NOT independent applications.

Project roles:

* auth → centralized authentication module
* naac-backend-main → core backend system
* ProfCV-main → future faculty module

The target architecture is defined in architecture.md.

IMPORTANT:
Do NOT refactor or modify any files yet.

Your task is ONLY architecture analysis and migration planning.

I want you to:

1. Analyze the current architecture of all projects

2. Compare them against architecture.md

3. Identify:

   * duplicated authentication logic
   * duplicated middleware
   * duplicated database logic
   * misplaced business logic
   * fat controllers
   * scalability problems
   * integration conflicts
   * circular dependency risks

4. Explain:

   * which files belong in each future module
   * which logic should become shared
   * which auth logic must be centralized
   * which middleware should become global
   * which models should reference userId

5. Generate:

   * BEFORE architecture
   * AFTER modular architecture
   * migration roadmap
   * risk assessment
   * dependency analysis

6. Treat ProfCV-main as the future /modules/faculty module inside the centralized backend.

7. Explain the safest incremental refactor order.

8. Wait for approval before suggesting code modifications.

Do not generate implementation code yet.
Only generate the architecture audit and migration analysis.
