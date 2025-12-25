const robot = require('robotjs')

export function get_task_bar_pos() {
  const size = robot.getScreenSize()
  const h = 40
  return [0, size.height - h, size.width, size.height]
}

export function get_screen_size() {
  const size = robot.getScreenSize()
  return [size.width, size.height]
}