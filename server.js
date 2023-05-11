// Import necessary packages
const inq = require("inquirer");
const sql = require("mysql2/promise");
const cTable = require('console.table');

// Load environment variables
require("dotenv").config();

// Define database credentials
const user = process.env.DB_USER;
const pass = process.env.DB_PASSWORD;
const name = process.env.DB_NAME;

// Establish database connection
async function connectToDB(queryType) {
  try {
    const db = await sql.createConnection({
      host: "localhost",
      user: user,
      password: pass,
      database: name,
    });

    let queryResult = [];
    let promptAnswers = [];

    switch (queryType) {
      case "View All Departments":
        queryResult = await db.query("SELECT * FROM department");
        console.table(queryResult[0]);
        break;

      case "View All Roles":
        queryResult = await db.query(`
                SELECT
                    role.id,
                    role.title,
                    role.salary,
                    department.name AS department
                FROM role
                JOIN department ON role.department_id = department.id
                `);
        console.table(queryResult[0]);
        break;

      case "View All Employees":
        queryResult = await db.query(`
                SELECT
                    employee.id,
                    employee.first_name,
                    employee.last_name,
                    role.title AS title,
                    department.name AS department,
                    role.salary AS salary,
                    CASE WHEN employee.manager_id IS NOT NULL THEN CONCAT(manager.first_name,' ', manager.last_name) ELSE NULL END AS manager
                FROM employee
                JOIN role ON employee.role_id = role.id
                JOIN department ON role.department_id = department.id
                JOIN employee manager ON employee.manager_id = manager.id
                `);
        console.table(queryResult[0]);
        break;

      case "Add a Department":
        promptAnswers = await inq.prompt([
          {
            name: "departmentName",
            message: "Enter New Department Name:",
          },
        ]);

        try {
          queryResult = await db.query(
            `INSERT INTO department (name) VALUES ('${promptAnswers.departmentName}');`
          );
        } catch (error) {
          console.log("Cannot insert duplicate Department");
        }

        break;

      case "Add a Role":
        promptAnswers = await inq.prompt([
          {
            name: "roleName",
            message: "Enter New Role Name:",
          },
          {
            name: "roleSalary",
            message: "Enter New Role Salary:",
          },
          {
            name: "roleDept",
            message: "Enter New Role Department:",
          },
        ]);

        const { roleName, roleSalary, roleDept } = promptAnswers;

        const deptId = await db.query(
          `SELECT IFNULL((SELECT id FROM department WHERE name = "${roleDept}"), "Department Does Not Exist")`
        );

        const department_id = Object.values(deptId[0][0])[0];

        if (department_id === "Department Does Not Exist") {
          console.log("Enter a Role in an Existing Department!");
          break;
        }

        queryResult = await db.query(
          ` INSERT INTO role (title, salary, department_id) VALUES ('${roleName}', '${roleSalary}', '${department_id}');`
        );

        break;

      case "Add an Employee":
        promptAnswers = await inq.prompt([
          {
            name: "firstName",
            message: "Enter New Employee's First Name:",
          },
          {
            name: "lastName",
            message: "Enter New Employee's Last Name:",
          },
          {
            name: "employeeRole",
            message: "Enter New Employee's Role:",
          },
          {
            name: "manager",
            message: "Enter New Employee's Manager:",
          },
        ]);

        const { firstName, lastName, employeeRole, manager } = promptAnswers;

        const roleId = await db.query(
          `SELECT IFNULL((SELECT id FROM role WHERE title = "${employeeRole}"), "Role Does Not Exist")`
        );

        const managerId = await db.query(
          `SELECT IFNULL((SELECT id FROM employee WHERE CONCAT(first_name,' ', last_name) = "${manager}"), "Manager Does Not Exist")`
        );

        const role_id = Object.values(roleId[0][0])[0];
        const manager_id = Object.values(managerId[0][0])[0];

        if (role_id === "Role Does Not Exist") {
          console.log("Enter an Existing Role for Employee!");
          break;
        }

        if (manager_id === "Manager Does Not Exist") {
          console.log("Enter an Existing Manager for Employee!");
          break;
        }

        queryResult = await db.query(
          `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${firstName}', '${lastName}', '${role_id}', '${manager_id}');`
        );

        break;

      case "Update an Employee Role":
        {
          promptAnswers = await inq.prompt([
            {
              name: "employeeName",
              message: "Enter Employee's Full Name:",
            },
            {
              name: "newRole",
              message: "Enter New Role Name:",
            },
          ]);
        }

        const { employeeName, newRole } = promptAnswers;

        const newRoleId = await db.query(
          `SELECT IFNULL((SELECT id FROM role WHERE title = "${newRole}"), "Role Does Not Exist")`
        );

        const employeeId = await db.query(
          `SELECT IFNULL((SELECT id FROM employee WHERE CONCAT(first_name,' ', last_name) = "${employeeName}"), "Employee Does Not Exist")`
        );

        const emp_id = Object.values(employeeId[0][0])[0];
        const new_role_id = Object.values(newRoleId[0][0])[0];

        if (emp_id === "Employee Does Not Exist") {
          console.log("Enter an Existing Employee!");
          break;
        }

        if (new_role_id === "Role Does Not Exist") {
          console.log("Enter an Existing Role for Employee!");
          break;
        }

        queryResult = await db.query(
          `UPDATE employee SET role_id = ${new_role_id} WHERE id = ${emp_id}`
        );

        break;

      default:
        console.log("Invalid Selection!");
    }

    await db.end();
  } catch (err) {
    console.log(err);
  }

  // Prompt user to select an action
  async function promptUser() {
    try {
      const { action } = await inq.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            "View All Departments",
            "View All Roles",
            "View All Employees",
            "Add a Department",
            "Add a Role",
            "Add an Employee",
            "Update an Employee Role",
            "Exit",
          ],
        },
      ]);

      if (action !== "Exit") {
        await connectToDB(action);
        await promptUser();
      }
    } catch (err) {
      console.log(err);
    }
}
promptUser();
}

