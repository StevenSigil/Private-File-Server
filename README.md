# Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.2.10.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

<br />

---

<br/>

# Creating a new Session Document

<br />

- **front**: Ask user for session name
  - Format session name and change as needed
  - Confirm name and base file directory with User --> yes/no
    - _no_: Reset modal and re-prompt...
    - _yes_: Close modal, START loading animation, continue

<br />

- **back**: check if name (filename @ data path) already exists --> yes/no
  - _yes_: throw and respond to error
  - _no_:
    - Get target directory information and add additional record information
    - Create (write) SESSION data to JSON file @ "data/sessions/file.json" path
    - Update MASTER session file with new session info.
    - Send JSON Success Response & continue...

<br />

- **front**: Wait for **API** response --> success/reject
  - STOP loading animation
    - _reject_: alert user session already exists
    - _success_: continue

<br />

**TODO: _Should subdirectories be resolved???_**

### ex:

```json
// sessionName.json
{
  "uuid": "xxx-xxx-xxx-...",
  "sessionName": "mySession",
  "created": "05/05/2005T15:05",
  "updated": "04/04/2004T14:04",
  "type": "movies",
  "sessionPath": "C:/Users/.../server/data/filename.json",
  "directoryInfo": {
    "basePath": "C:/Users/.../my dir/",
    "files": ["x.ext", "y.ex", "z.ext"],
    "folders": ["a", "b", "c"]
  }
}
```

```json
// MASTER.json
{
  "mySession": {
    "uuid": "xxx-xxx-xxx-...",
    "sessionName": "mySession",
    "created": "05/05/2005T15:05",
    "updated": "04/04/2004T14:04",
    "type": "movies",
    "sessionPath": "C:/Users/.../server/data/filename.json"
  },
  "session2": {
    ...
  }
}
```
