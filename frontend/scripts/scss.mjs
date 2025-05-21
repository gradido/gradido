#!/usr/bin/env node
/* eslint-disable no-console */

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { watch as _watch } from 'chokidar'

// Create css directory if it doesn't exist
const cssDir = join('src', 'assets', 'css')
mkdirSync(cssDir, { recursive: true })

// Paths configuration
const config = {
  src: join('src', 'assets', 'scss', 'gradido.scss'),
  dest: join('src', 'assets', 'css', 'gradido.css'),
  nodePath: join('..', 'node_modules'),
  scssPath: join('src', 'assets', 'scss'),
}

// Parse command line arguments
const mode = process.argv[2] === 'watch' ? 'watch' : 'compile'
const preferredCompiler = process.argv[3]

// Determine which compiler to use
// if sass was preferred, use it, else use grass if available
function determineCompiler() {
  if (preferredCompiler !== 'sass') {
    try {
      execSync('grass --version', { stdio: 'ignore' })
      return 'grass'
    } catch (e) {
      // grass not found, fallback to sass
    }
  }
  return 'sass'
}

const compiler = determineCompiler()

function runGrass(compressed = false) {
  const commonGrassArgs = [
    '--load-path',
    config.nodePath,
    '--load-path',
    config.scssPath,
    config.src,
    config.dest,
  ]
  if (compressed) {
    commonGrassArgs.unshift('-s', 'compressed')
  }
  try {
    execSync(`grass ${commonGrassArgs.join(' ')}`)
    console.log('SCSS compiled successfully')
  } catch (error) {
    console.error('Error compiling SCSS:', error.message)
  }
}

// Compile SCSS function
function compileScss(mode, compiler) {
  if (compiler === 'grass') {
    console.log(`Use Grass for ${mode} SCSS`)
    if (mode === 'watch') {
      const watcher = _watch(config.scssPath)
      watcher.on('change', () => runGrass(false))
    } else {
      runGrass(true)
    }
  } else {
    console.log(`Use Sass for ${mode} SCSS`)
    const commonSassArgs = [
      '--silence-deprecation=import',
      '--silence-deprecation=global-builtin',
      '--silence-deprecation=color-functions',
      `--load-path=${config.nodePath}`,
      `--load-path=${config.scssPath}`,
      `${config.src}:${config.dest}`,
    ]
    if (mode === 'watch') {
      // for process running in background
      // we could also use chokidar but sass --watch is better, because it can trigger partly recompiling
      const sassProcess = spawn('sass', ['--watch', ...commonSassArgs], { stdio: 'inherit' })
      sassProcess.on('error', (error) => {
        console.error('Error starting sass process:', error)
      })
    } else {
      try {
        // for one time running process
        execSync(`sass --style=compressed ${commonSassArgs.join(' ')}`)
        console.log('SCSS compiled successfully')
      } catch (error) {
        console.error('Error compiling SCSS:', error.message)
      }
    }
  }
}

// Run the compiler
compileScss(mode, compiler)
