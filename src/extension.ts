import * as vscode from "vscode";
import * as proc from "child_process";
import { TargetsProvider, SourceRootsProvider } from "./treeviews";
import { logger } from "./logging";
import { CodeLensProvider } from "./codelens";
import { TestsProvider } from "./test-explorer";
import { getPantsExecutable } from "./configuration";

// TODO: Destructure vscode imports

// let disposables: vscode.Disposable[] = [];

function runGoalOnAllTargets(name: string, cwd?: string): void {
  logger.show();

  const options: proc.SpawnOptions = {
    cwd,
  };
  const subprocess = proc.spawn(getPantsExecutable(), [name, "::"], options);
  subprocess.stdout?.on("data", (data) => logger.log(data.toString()));
  subprocess.stderr?.on("data", (data) => logger.log(data.toString()));
}

const extensionName = "robotpajamas.vscode-suspenders";
const extensionVersion = "0.0.2";

export function activate(context: vscode.ExtensionContext) {
  logger.info(`Extension name: ${extensionName}`);
  logger.info(`Extension version: ${extensionVersion}`);

  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.checkAll", () => {
      runGoalOnAllTargets("check", rootPath);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.fmtAll", () => {
      runGoalOnAllTargets("fmt", rootPath);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.lintAll", () => {
      runGoalOnAllTargets("lint", rootPath);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.testAll", () => {
      runGoalOnAllTargets("test", rootPath);
    })
  );

  const sourceRootsProvider = new SourceRootsProvider(rootPath);
  vscode.window.registerTreeDataProvider("source-roots", sourceRootsProvider);
  vscode.commands.registerCommand("suspenders.source-roots.refresh", () =>
    sourceRootsProvider.refresh()
  );

  const targetsProvider = new TargetsProvider(rootPath);
  vscode.window.registerTreeDataProvider("targets", targetsProvider);
  vscode.commands.registerCommand("suspenders.targets.refresh", () => targetsProvider.refresh());

  vscode.commands.executeCommand("setContext", "suspenders:isActivated", true);

  const codeLensProvider = new CodeLensProvider();
  vscode.languages.registerCodeLensProvider({ pattern: "**/BUILD*" }, codeLensProvider);

  const testController = vscode.tests.createTestController(
    "suspenders-test-controller",
    "All of the Tests"
  );
  const testsProvider = new TestsProvider(testController);
  vscode.commands.registerCommand("suspenders.tests.refresh", () => testsProvider.refresh());
}

export function deactivate() {
  // if (disposables) {
  //   disposables.forEach((item) => item.dispose());
  // }
  // disposables = [];
}
