const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table')

// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Lebronmu27!',
  database: 'employee_db'
});

// Define the main function that displays the menu and handles user input
function main() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all role',
        'View all employee',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit'
      ]
    }
  ]).then(answer => {
    switch (answer.option) {
      case 'View all departments':
        viewAllDepartments();
        break;
      case 'View all roles':
        viewAllRole();
        break;
      case 'View all employees':
        viewAllEmployee();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      case 'Exit':
        console.log('Goodbye!');
        process.exit(0);
        break;
    }
  });
}

// Define functions for each option in the menu
function viewAllDepartments() {
  db.query('SELECT * FROM department', (err, results) => {
    if (err) throw err;
    console.table(results);
    main();
  });
}

function viewAllRole() {
  db.query('SELECT roles.title, roles.salary, departments.name AS department FROM roles JOIN department ON roles.department_id = department.id', (err, results) => {
    if (err) throw err;
    console.table(results);
    main();
  });
}

function viewAllEmployee() {
  db.query('SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(managers.first_name, " ", managers.last_name) AS manager FROM employees LEFT JOIN roles ON employees.role_id = roles.id LEFT JOIN departments ON roles.department_id = departments.id LEFT JOIN employees managers ON employees.manager_id = managers.id', (err, results) => {
    if (err) throw err;
    console.table(results);
    main();
  });
}

function addDepartment() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the new department:'
    }
  ]).then(answer => {
    db.query('INSERT INTO department SET ?', { name: answer.name }, (err, result) => {
      if (err) throw err;
      console.log(`${answer.name} department added to the database.`);
      main();
    });
  });
}

function addRole() {
    // Retrieve department data from database
    db.query('SELECT * FROM department', (err, results) => {
      if (err) throw err;
      inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the title of the new role:'
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the salary for the new role:'
        },
        {
          type: 'list',
          name: 'department',
          message: 'Select the department for the new role:',
          choices: results.map(department => ({
            name: department.name,
            value: department.id
          }))
        }
      ]).then(answer => {
        // Insert new role data into database
        db.query(
          'INSERT INTO role SET ?',
          {
            title: answer.title,
            salary: answer.salary,
            department_id: answer.department
          },
          err => {
            if (err) throw err;
            console.log('New role added successfully!');
            // Call main menu function or other function to continue program
          }
        );
      });
    });
  }
