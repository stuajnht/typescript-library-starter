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

let inCI = process.env.CI
let username = exec('git config user.name').stdout.trim()
let usermail = exec('git config user.email').stdout.trim()



///
/// Helper functions
///

function resolve(p: any) {
  return path.resolve(__dirname, '..', p)
}



///
/// Library Name functions
///

/**
 * Sets the library name to be used for generating the files
 * 
 * This function works in this way:
 * ```
 * If running in a CI environment, the library name is 'test'
 * If the suggested library name isn't "typescript-library-starter"
 *  Ask the if they are happy with the suggested library name
 *    Return suggested name
 * Ask for the library name and return it
 * ```
 * @param usingCI
 */
function libraryNameSet(usingCI: boolean) {
  if (!usingCI) {
    if (!suggestedLibraryNameIsDefault() && suggestedLibraryNameAccepted()) {
      return suggestedLibraryName()
    }

    _prompt.get(_promptSchemaLibraryName, (err: any, res: any) => {
      if (err) {
        console.log(colors.red('There was an error building the workspace :('))
        process.exit(1)
        return
      }
  
      return res.library
    })
  }
  
  return 'test' // This is the default when running inside CI infrastructure
}

/**
 * Sees if the users wants to use the suggested library name if the project
 * has been cloned into a custom directory (i.e. it's not 'typescript-library-starter')
 */
function suggestedLibraryNameAccepted() {
  _prompt.get(_promptSchemaLibrarySuggest, (err: any, res: any) => {
    if (err) {
      console.log(colors.red("Sorry, you'll need to type the library name"))
      return false
    }

    if (res.useSuggestedName.toLowerCase() == 'yes') {
      return true
    }

    return false
  })
}

/**
 * The library name is suggested by looking at the directory name of the
 * tools parent directory and converting it to kebab-case
 * 
 * The regex for this looks for any non-word or non-digit character, or
 * an underscore (as it's a word character), and replace it with a dash
 */
function suggestedLibraryName() {
  return path.basename(__dirname + '../../')
             .replace(/[^\w\d]|_/g, '-')
             .toLowerCase()
}

/**
 * This checks if the suggested library name is the default, which
 * is 'typescript-library-starter'
 */
function suggestedLibraryNameIsDefault() {
  if (suggestedLibraryName() == 'typescript-library-starter') {
    return true
  }

  return false
}



///
/// Questions for the user
///
const _promptSchemaLibraryName = {
  properties: {
    library: {
      description: colors.cyan("What do you want the library to be called (kebab-case):"),
      pattern: /^[a-z]+(\-[a-z]+)*$/,
      type: 'string',
      required: true,
    },
  },
}

const _promptSchemaLibrarySuggest = {
  properties: {
    useSuggestedName: {
      description: colors.cyan('Would you like it to be called "'+suggestedLibraryName()+'"? [Yes/No]:'),
      pattern: /^(yes|no)$/i,
      type: 'string',
      required: true,
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

// Generate the library name
let libraryName = libraryNameSet(inCI)
console.log(colors.green('The library is going to be called: '+libraryName))
