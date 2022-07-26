import {
  copySync,
  mkdirSync,
  readdirSync,
  readFileSync,
  removeSync,
  writeFileSync,
} from 'fs-extra'
import { format } from 'prettier'

const ASSETS_PATH = `${process.cwd()}/src/assets`

function generateFileName(filename: string) {
  return filename
    .split('-')
    .map((substr) => substr.replace(/^\w/, (c) => c.toUpperCase()))
    .join('')
    .replaceAll('.svg', '')
}

function generateComponent(fileName: string) {
  const generatedFileName = generateFileName(fileName)
  let fileOutput = `/** GENERATED FILE **/`
  let fileContents = readFileSync(`${ASSETS_PATH}/${fileName}`).toString(
    'utf-8'
  )

  fileContents = fileContents
    .replaceAll(/<\/?svg.*>/g, '')
    .replaceAll(/^.*<\?xml.*?\>/g, '')
    .replaceAll(/fill\-rule/g, 'fillRule')
    .replaceAll(/stroke-linecap/g, 'strokeLinecap')
    .replaceAll(/stroke-linejoin/g, 'strokeLinejoin')
    .replaceAll(/stroke-width/g, 'strokeWidth')
    .replaceAll(/stroke-miterlimit/g, 'strokeMiterlimit')
    .replaceAll(/white/g, 'currentColor')

  fileOutput += `
import React from "react"
import QuasarIcon from "../types"

const ${generatedFileName}: React.FC<QuasarIcon> = ({ size }: QuasarIcon) => {
  return <svg
    width=\{\`\$\{size ?? 24\}\`\}
    height=\{\`\$\{size ?? 24\}\`\}
    viewBox=\{\`0 0 24 24\`\}
    fill="none">${fileContents}</svg>
}

export default ${generatedFileName}
  `
  fileOutput = format(fileOutput, {
    parser: 'babel',
    singleQuote: true,
    jsxSingleQuote: true,
    semi: false,
    tabWidth: 2,
    printWidth: 80,
    bracketSpacing: true,
    arrowParens: 'always',
    trailingComma: 'es5',
    endOfLine: 'auto',
  })

  try {
    writeFileSync(
      `${process.cwd()}/dist/icons/${generatedFileName}.tsx`,
      fileOutput
    )
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

function compile() {
  removeSync(`${process.cwd()}/dist`)
  mkdirSync(`${process.cwd()}/dist`)
  mkdirSync(`${process.cwd()}/dist/icons`)
  const files = readdirSync(ASSETS_PATH, 'utf-8')
  files.forEach((file) => {
    if (!file.match(/.*\.svg$/)) return
    generateComponent(file)
  })
  let fileOutput = `/** GENERATED FILE **/`
  writeFileSync(
    `${process.cwd()}/dist/index.ts`,
    `${fileOutput}
${files
  .map((filename) => {
    return `export { default as ${generateFileName(
      filename
    )} } from './icons/${generateFileName(filename)}'`
  })
  .join('\n')}
`
  )
  copySync(`${process.cwd()}/src/public`, `${process.cwd()}/dist`)
}

compile()
