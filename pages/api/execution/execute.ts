import { NextApiRequest, NextApiResponse } from 'next';
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Test Docker connectivity
docker.ping((err) => {
  if (err) {
    console.error('Error connecting to Docker:', err);
  } else {
    console.log('Docker is accessible.');
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Received request:', req.method, req.url);

  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { language, code, stdin } = req.body as {
    language: string;
    code: string;
    stdin: string;
  };

  console.log('Request body:', {
    language,
    codeLength: code.length,
    stdinLength: stdin.length,
  });

  if (!language || !code) {
    console.error('Language or code not provided.');
    return res.status(400).json({ error: 'Language and code are required.' });
  }

  const languageToImageMap: { [key: string]: string } = {
    python: 'code-runner-python',
    javascript: 'code-runner-javascript',
    java: 'code-runner-java',
    c: 'code-runner-c',
    cpp: 'code-runner-cpp',
    ruby: 'code-runner-ruby',
    go: 'code-runner-go',
    php: 'code-runner-php',
    rust: 'code-runner-rust',
    swift: 'code-runner-swift',
  };

  const image = languageToImageMap[language.toLowerCase()];
  if (!image) {
    console.error('Unsupported language:', language);
    return res.status(400).json({ error: 'Unsupported language.' });
  }

  try {
    // Create temporary directory for code and input
    const tempDir = path.join(
      '/tmp',
      `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    );
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('Created temporary directory:', tempDir);

    // Write code to a file
    const codeFilename = getCodeFilename(language);
    fs.writeFileSync(path.join(tempDir, codeFilename), code);
    console.log('Wrote code file:', codeFilename);

    // Write stdin to a file
    fs.writeFileSync(path.join(tempDir, 'input.txt'), stdin || '');
    console.log('Wrote input file: input.txt');

    // Create and start the container
    console.log('Creating Docker container...');
    const container = await docker.createContainer({
      Image: image,
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: '/code',
      HostConfig: {
        AutoRemove: true,
        Binds: [`${tempDir}:/code`],
        NetworkMode: 'none',
        Memory: 256 * 1024 * 1024, // 256MB
        CpuPeriod: 100000,
        CpuQuota: 50000, // 50% CPU
        CapDrop: ['ALL'],
      },
    });
    console.log('Created container:', container.id);

    // Start the container
    console.log('Starting container...');
    await container.start();
    console.log('Container started.');

    // Set a timeout
    const timeout = 5000;
    let timeoutHandle: NodeJS.Timeout;
    let timedOut = false;

    const containerPromise = new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number;
    }>(async (resolve, reject) => {
      try {
        const logStream = new PassThrough();

        const stdoutBuffers: Buffer[] = [];
        const stderrBuffers: Buffer[] = [];

        console.log('Attaching to container output streams...');
        const stream = await container.attach({
          stream: true,
          stdout: true,
          stderr: true,
        });

        container.modem.demuxStream(stream, logStream, logStream);

        logStream.on('data', (chunk: Buffer) => {
          stdoutBuffers.push(chunk);
        });

        logStream.on('error', (err: Error) => {
          console.error('Log stream error:', err);
          reject(err);
        });

        console.log('Waiting for container to finish...');
        const waitResult = await container.wait();
        console.log('Container finished with status:', waitResult.StatusCode);

        const stdout = Buffer.concat(stdoutBuffers).toString();
        const stderr = Buffer.concat(stderrBuffers).toString();
        resolve({ stdout, stderr, exitCode: waitResult.StatusCode });
      } catch (err) {
        console.error('Error during container execution:', err);
        reject(err);
      }
    });

    timeoutHandle = setTimeout(async () => {
      console.warn('Execution timed out. Killing container...');
      timedOut = true;
      await container.kill();
    }, timeout);

    const { stdout, stderr, exitCode } = await containerPromise;

    clearTimeout(timeoutHandle);

    console.log('Execution completed. Cleaning up temporary directory...');
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Temporary directory deleted.');

    if (timedOut) {
      res.status(200).json({
        stdout: '',
        stderr: 'Error: Execution timed out.',
        exitCode: null,
      });
    } else {
      res.status(200).json({ stdout, stderr, exitCode });
    }
  } catch (err) {
    console.error('Execution error:', err);
    res.status(500).json({ error: 'Execution error.' });
  }
}

// Helper function to get code filename based on language
function getCodeFilename(language: string): string {
  switch (language.toLowerCase()) {
    case 'python':
      return 'code.py';
    case 'javascript':
      return 'code.js';
    case 'java':
      return 'Main.java';
    case 'c':
      return 'code.c';
    case 'cpp':
      return 'code.cpp';
    case 'ruby':
      return 'code.rb';
    case 'go':
      return 'code.go';
    case 'php':
      return 'code.php';
    case 'rust':
      return 'main.rs';
    case 'swift':
      return 'code.swift';
    default:
      return 'code.txt';
  }
}
