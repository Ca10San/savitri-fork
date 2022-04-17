const { readdirSync } = require('fs')

/**
 * @exports @const
 * Array of lowercased controller names.
*/
export const commonControllers = readdirSync(`${__dirname}/../../entities`)
/**
 * @exports @const
 * Retrieves controller class from alias.
 */
export const getController = (controller: string) => {
  const controllerPath = commonControllers.includes(controller)
    ? `${__dirname}/../../entities`
    : `${process.cwd()}/entities`

  const sanitizedName = controller.replace(/\./g, '') as string & { capitalize: () => string }

  const controllerFile = `${sanitizedName}/${sanitizedName}.ctl`
  const controllerName = `${sanitizedName.capitalize()}Controller`

  const Controller = require(`${controllerPath}/${controllerFile}`)[controllerName]

  return Controller
}

export * from './Controller'
export * from './Mutable'