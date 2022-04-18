import { AccessProfileDocument, AccessProfile } from './accessProfile.model'
import { default as Description } from './index.json'
import { Mutable } from '../../core/controller'

export class AccessProfileController extends Mutable<AccessProfileDocument> {
  constructor() {
    super(AccessProfile, Description, {
      publicMethods: ['getAll']
    })
  }
}
