/**
 * Auto Click Script Runner
 * Usage: node runner.js <config-file.json>
 */

const fs = require('fs');
const path = require('path');

// Placeholder for automation libraries
// const robot = require('robotjs'); 
// const { keyboard, mouse, Key } = require('@nut-tree/nut-js');

async function main() {
  const configFile = process.argv[2];
  if (!configFile) {
    console.error('Please provide a config file path');
    process.exit(1);
  }

  const configPath = path.isAbsolute(configFile) ? configFile : path.resolve(process.cwd(), configFile);
  if (!fs.existsSync(configPath)) {
    console.error('Config file not found:', configPath);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { nodes, edges } = config;

  console.log('Loaded config with', nodes.length, 'nodes and', edges.length, 'edges');

  // Find Start Node
  // We assume 'start-node' id or the one with type 'input' and no incoming edges (or just 'start-node' from our generator)
  let currentNode = nodes.find(n => n.id === 'start-node') || nodes.find(n => n.type === 'input');

  if (!currentNode) {
    console.error('No start node found!');
    process.exit(1);
  }

  console.log('Starting execution...');

  while (currentNode) {
    console.log(`\n--- Executing Node: ${currentNode.label || currentNode.id} (${currentNode.type}) ---`);
    
    let result = true; // Default success

    try {
      result = await executeNode(currentNode);
    } catch (e) {
      console.error('Error executing node:', e);
      result = false;
    }

    const outcome = result ? 'success' : 'fail';
    console.log(`Outcome: ${outcome}`);

    // Find next node based on outcome
    const edge = edges.find(e => 
      e.source === currentNode.id && 
      (e.sourceHandle === outcome || (!e.sourceHandle && outcome === 'success')) // Default to success if no handle specified
    );

    if (edge) {
      currentNode = nodes.find(n => n.id === edge.target);
    } else {
      console.log('No connection for outcome. Ending flow.');
      currentNode = null;
    }
  }

  console.log('\nExecution finished.');
}

async function executeNode(node) {
  const data = node.data || {};

  switch (node.type) {
    case 'input': // Start node
      return true;

    case 'sleep':
      const duration = parseFloat(data.duration || 1);
      const isRandom = data.mode === 'random';
      let time = duration;
      if (isRandom && data.maxDuration) {
        time = duration + Math.random() * (data.maxDuration - duration);
      }
      console.log(`Sleeping for ${time.toFixed(2)}s...`);
      await new Promise(r => setTimeout(r, time * 1000));
      return true;

    case 'text':
      console.log(`Typing text: "${data.text}" (Mode: ${data.inputType})`);
      // Implementation: robot.typeString(data.text);
      return true;

    case 'image':
      console.log(`Searching for image: ${data.imageName}`);
      // Implementation: 
      // const screen = robot.screen.capture();
      // const matches = findImage(screen, data.image);
      // if (matches) { robot.moveMouse(matches.x, matches.y); robot.mouseClick(); return true; }
      // return false;
      return true; // Mock success

    case 'dom':
      console.log(`Finding DOM element: ${data.selector}`);
      // Implementation requires browser connection
      return true;

    default:
      console.warn(`Unknown node type: ${node.type}`);
      return true;
  }
}

// Shortcuts listener (Mock)
// In a real Node.js script, handling global hotkeys requires 'iohook' or similar native modules.
console.log('Shortcuts listener initialized (Mock): Ctrl+C to Stop, Ctrl+P to Pause, Ctrl+R to Resume');

main().catch(console.error);
