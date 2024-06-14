    const fs = require('fs');
    const path = require('path');

    // Get the project name from the current directory
    const projectName = path.basename(process.cwd());

    // Read the package.json file
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);

    // Update the name field
    packageJson.name = projectName;

    // Remove the postinstall script entry
    if (packageJson.scripts && packageJson.scripts.postinstall) {
    delete packageJson.scripts.postinstall;
    }

    // Write the updated package.json back to the file
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Delete this script file
    fs.unlinkSync(__filename);
