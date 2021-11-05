import { spawn } from "child_process";
const pythonDir = "./server/python_scripts/";
// const python = pythonDir + "venv/scripts/python.exe";
const python = "python";

export default function runPy(scriptName, args) {
  return new Promise(function (success, reject) {
    const script = pythonDir + scriptName;
    const pyArgs = [script, args];
    const pyProg = spawn(python, pyArgs);

    let result = "";
    let resultError = "";

    pyProg.stdout.on("data", (data) => {
      result += data.toString();
    });

    pyProg.stderr.on("data", (data) => {
      resultError += data.toString();
    });

    pyProg.stdout.on("end", () => {
      if (resultError != "") {
        // console.error(
        //   `PYTHON ERROR (runPy.js: 26)! YOU CAN REPRODUCE THE ERROR WITH: \
        //   \n\tCOMMAND: ${python}\n\tSCRIPT: ${script} \
        //   \n\tARGS: [${pyArgs.slice(1).join(", ")}]\n`
        // );
        const error = new Error("\t" + JSON.stringify(resultError));
        console.error(error);
        const jsonErrorMessage = {
          error: `ERROR RETRIEVING DIRECTORY FROM: "${args}" -- See terminal for details.`,
        };
        reject(jsonErrorMessage);
      } else {
        success(result);
      }
    });
  });
}
