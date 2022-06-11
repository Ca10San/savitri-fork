import YAML from 'yaml'
import { Controller } from '../../core/controller'
import { default as Description } from './index.json'

const path = require('path')
const { readFile } = require('fs').promises

const MAX_ENTRIES = 32

export class ReleaseController extends Controller<unknown> {
  constructor() {
    super({
      description: {
        module: 'release'
      }
    })
  }

  public async getAll() {
    const baseRelease = await readFile(path.resolve(__dirname, '../../RELEASE.yml'), 'utf8')
    const productRelease = await readFile(path.resolve(process.cwd(), './RELEASE.yml'), 'utf8')

    const base = YAML.parse(baseRelease).slice(0, MAX_ENTRIES)
    const product = YAML.parse(productRelease).slice(0, MAX_ENTRIES)

    return {
      base,
      product
    }
  }
}
