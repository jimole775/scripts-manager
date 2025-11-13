import yaml from 'js-yaml'
import { read } from './file.js'

export default {
  load(path) {
    if (!path) return '';
    const content = read(path) || '';
    return content ? yaml.load(content) : '';
  }
}
