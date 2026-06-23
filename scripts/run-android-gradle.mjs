import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const gradleTasks = process.argv.slice(2);
const isWindows = process.platform === 'win32';
const javaExecutable = isWindows ? 'java.exe' : 'java';

function isValidJavaHome(javaHome) {
  if (!javaHome) return false;
  return existsSync(path.join(javaHome, 'bin', javaExecutable));
}

function getCandidateJavaHomes() {
  const candidates = [
    process.env.JAVA_HOME,
    process.env.ANDROID_STUDIO_JBR,
  ].filter(Boolean);

  if (isWindows) {
    candidates.push(
      'C:\\Program Files\\Android\\Android Studio\\jbr',
      'C:\\Program Files\\Android\\Android Studio\\jre',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.15.6-hotspot',
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
      '/Applications/Android Studio.app/Contents/jbr',
      '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home',
      '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home',
    );
  } else {
    candidates.push(
      '/opt/android-studio/jbr',
      '/usr/lib/jvm/temurin-21-jdk',
      '/usr/lib/jvm/temurin-17-jdk',
    );
  }

  return [...new Set(candidates)];
}

function resolveJavaHome() {
  for (const candidate of getCandidateJavaHomes()) {
    if (isValidJavaHome(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function main() {
  if (gradleTasks.length === 0) {
    console.error('[android-gradle] ERROR: no Gradle task was provided.');
    process.exit(1);
  }

  const env = { ...process.env };
  const javaHome = resolveJavaHome();

  if (javaHome) {
    env.JAVA_HOME = javaHome;
    env.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${env.PATH ?? ''}`;
    console.log(`[android-gradle] Using Java home: ${javaHome}`);
  } else {
    console.warn('[android-gradle] WARN: JAVA_HOME not found. Falling back to whatever "java" is available in PATH.');
  }

  const child = spawn(
    isWindows ? 'gradlew.bat' : './gradlew',
    gradleTasks,
    {
      cwd: androidDir,
      env,
      stdio: 'inherit',
      shell: isWindows,
    },
  );

  child.on('error', (error) => {
    console.error(`[android-gradle] ERROR: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

main();
