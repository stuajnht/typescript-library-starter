/**
 * This script runs automatically after your first npm-install.
 */
const _prompt = require('prompt')
const { mv, rm, which, exec } = require('shelljs')
const replace = require('replace-in-file')
const colors = require('colors')
const path = require('path')
const { readFileSync, writeFileSync } = require('fs')
const { fork } = require('child_process')

if (!which('git')) {
  console.log(colors.red('Sorry, this script requires git'))
  process.exit(1)
}



///
/// Helper variables
///

let libraryName = 'test' // Default, in case this is running in a CI environment
let username = exec('git config user.name').stdout.trim()
let usermail = exec('git config user.email').stdout.trim()



///
/// Files / directories to be changed
///

// These are all relative to the project root directory
const rmDirs = ['.git']
const rmFiles = ['tools/init.ts', '.all-contributorsrc', '.gitattributes']



///
/// Helper functions
///

function resolve(p: any) {
  return path.resolve(__dirname, '..', p)
}

function inCI() {
  if (process.env.CI == null) {
    return false
  }

  return true
}



///
/// Library Name functions
///

function libraryNameCreate() {
  _prompt.get(_promptSchemaLibraryName, (err: any, res: any) => {
    if (err) {
      console.log(colors.red('Sorry, there was an error building the workspace :('))
      process.exit(1)
      return
    }

    libraryName = res.library
    processLibraryProject()
  })
}

/**
 * Sees if the users wants to accept the suggested library name if the project
 * has been cloned into a custom directory (i.e. it's not 'typescript-library-starter')
 */
function libraryNameSuggestedAccept() {
  _prompt.get(_promptSchemaLibrarySuggest, (err: any, res: any) => {
    if (err) {
      console.log(colors.red("Sorry, you'll need to type the library name"))
      libraryNameCreate()
    }

    if (res.useSuggestedName.toLowerCase().charAt(0) == 'y') {
      libraryName = libraryNameSuggested()
      processLibraryProject()
    } else {
      libraryNameCreate()
    }
  })
}

/**
 * The library name is suggested by looking at the directory name of the
 * tools parent directory and converting it to kebab-case
 * 
 * The regex for this looks for any non-word or non-digit character, or
 * an underscore (as it's a word character), and replace it with a dash.
 * Any leading or trailing dashes are then removed, before the string is
 * lowercased and returned
 */
function libraryNameSuggested() {
  return path.basename(path.resolve(__dirname, '..'))
             .replace(/[^\w\d]|_/g, '-')
             .replace(/^-+|-+$/g, '')
             .toLowerCase()
}

/**
 * This checks if the suggested library name is the default, which
 * is 'typescript-library-starter'
 */
function libraryNameSuggestedIsDefault() {
  if (libraryNameSuggested() == 'typescript-library-starter') {
    return true
  }

  return false
}



///
/// Setup library
///

function processLibraryProject() {
  console.log(colors.cyan("\nThanks for that. The last few changes are being made... hang tight!\n\n"))

  removeItems()
}

function removeItems() {
  console.log(colors.underline.white('Removed'));
  
  let dirs = rmDirs.map(f => path.resolve(__dirname, '..', f))
  rm('-rf', dirs)
  console.log(colors.red(rmDirs.join("\n")))

  let files = rmFiles.map(f => path.resolve(__dirname, '..', f))
  rm(files)
  console.log(colors.red(rmFiles.join("\n")))
}



///
/// Questions for the user
///
const _promptSchemaLibraryName = {
  properties: {
    library: {
      description: colors.cyan("What do you want the library to be called (use kebab-case)"),
      pattern: /^[a-z]+(\-[a-z]+)*$/,
      type: 'string',
      required: true,
      message: '"kebab-case" uses lowercase letters, and hyphens instead of spaces',
    },
  },
}

const _promptSchemaLibrarySuggest = {
  properties: {
    useSuggestedName: {
      description: colors.cyan('Would you like it to be called "'+libraryNameSuggested()+'"? [Yes/No]'),
      pattern: /^(y(es)?|n(o)?)$/i,
      type: 'string',
      required: true,
      message: 'You need to type "Yes" or "No" to continue...',
    },
  },
}



///
/// Post setup tasks
///

_prompt.start()
_prompt.message = ''

// Clear console
let lines = (process.stdout as any).getWindowSize()[1]
for (let i = 0; i < lines; i++) {
  console.log('\r\n')
}

// Say hi!
console.log(colors.cyan("Hi! You're almost ready to make the next great TypeScript library."))

// Generate the library name and start the tasks
if (!inCI()) {
  if (!libraryNameSuggestedIsDefault()) {
    libraryNameSuggestedAccept()
  } else {
    libraryNameCreate()
  }
} else {
  // This is being run in a CI environment, so don't ask any questions
  processLibraryProject()
}
