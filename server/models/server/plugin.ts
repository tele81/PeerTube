import { AllowNull, Column, CreatedAt, DataType, DefaultScope, Is, Model, Table, UpdatedAt } from 'sequelize-typescript'
import { getSort, throwIfNotValid } from '../utils'
import {
  isPluginDescriptionValid,
  isPluginNameValid,
  isPluginTypeValid,
  isPluginVersionValid
} from '../../helpers/custom-validators/plugins'
import { PluginType } from '../../../shared/models/plugins/plugin.type'
import { PeerTubePlugin } from '../../../shared/models/plugins/peertube-plugin.model'
import { FindAndCountOptions } from 'sequelize'

@DefaultScope(() => ({
  attributes: {
    exclude: [ 'storage' ]
  }
}))

@Table({
  tableName: 'plugin',
  indexes: [
    {
      fields: [ 'name' ],
      unique: true
    }
  ]
})
export class PluginModel extends Model<PluginModel> {

  @AllowNull(false)
  @Is('PluginName', value => throwIfNotValid(value, isPluginNameValid, 'name'))
  @Column
  name: string

  @AllowNull(false)
  @Is('PluginType', value => throwIfNotValid(value, isPluginTypeValid, 'type'))
  @Column
  type: number

  @AllowNull(false)
  @Is('PluginVersion', value => throwIfNotValid(value, isPluginVersionValid, 'version'))
  @Column
  version: string

  @AllowNull(false)
  @Column
  enabled: boolean

  @AllowNull(false)
  @Column
  uninstalled: boolean

  @AllowNull(false)
  @Column
  peertubeEngine: string

  @AllowNull(true)
  @Is('PluginDescription', value => throwIfNotValid(value, isPluginDescriptionValid, 'description'))
  @Column
  description: string

  @AllowNull(true)
  @Column(DataType.JSONB)
  settings: any

  @AllowNull(true)
  @Column(DataType.JSONB)
  storage: any

  @CreatedAt
  createdAt: Date

  @UpdatedAt
  updatedAt: Date

  static listEnabledPluginsAndThemes () {
    const query = {
      where: {
        enabled: true,
        uninstalled: false
      }
    }

    return PluginModel.findAll(query)
  }

  static load (pluginName: string) {
    const query = {
      where: {
        name: pluginName
      }
    }

    return PluginModel.findOne(query)
  }

  static getSetting (pluginName: string, settingName: string) {
    const query = {
      attributes: [ 'settings' ],
      where: {
        name: pluginName
      }
    }

    return PluginModel.findOne(query)
      .then(p => p.settings)
      .then(settings => {
        if (!settings) return undefined

        return settings[settingName]
      })
  }

  static setSetting (pluginName: string, settingName: string, settingValue: string) {
    const query = {
      where: {
        name: pluginName
      }
    }

    const toSave = {
      [`settings.${settingName}`]: settingValue
    }

    return PluginModel.update(toSave, query)
      .then(() => undefined)
  }

  static listForApi (options: {
    type?: PluginType,
    uninstalled?: boolean,
    start: number,
    count: number,
    sort: string
  }) {
    const query: FindAndCountOptions = {
      offset: options.start,
      limit: options.count,
      order: getSort(options.sort),
      where: {}
    }

    if (options.type) query.where['type'] = options.type
    if (options.uninstalled) query.where['uninstalled'] = options.uninstalled

    return PluginModel
      .findAndCountAll(query)
      .then(({ rows, count }) => {
        return { total: count, data: rows }
      })
  }

  toFormattedJSON (): PeerTubePlugin {
    return {
      name: this.name,
      type: this.type,
      version: this.version,
      enabled: this.enabled,
      uninstalled: this.uninstalled,
      peertubeEngine: this.peertubeEngine,
      description: this.description,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

}