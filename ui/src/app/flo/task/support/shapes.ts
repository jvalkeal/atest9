import {defaultsDeep} from 'lodash';
import * as _joint from 'jointjs';

// Loaded joint additions
import '../../shared/support/shared-shapes';

const joint: any = _joint;

const ERROR_MARKER_SIZE = {width: 20, height: 20};
const START_NODE_SIZE = {width: 15, height: 15};
const END_NODE_SIZE = {width: 20, height: 20};
const PORT_RADIUS = 7;

export const NODE_ROUNDED_CORNER = 8;
export const NODE_ROUNDED_CORNER_PALETTE = 3;

export const IMAGE_W = 180;
export const IMAGE_H = 64;
export const CONTROL_GROUP_TYPE = 'control nodes';
export const TASK_GROUP_TYPE = 'task';

export const START_NODE_TYPE = 'START';
export const END_NODE_TYPE = 'END';
export const SYNC_NODE_TYPE = 'SYNC';

export const TaskAppShape = joint.shapes.basic.Generic.extend({
  defaults: defaultsDeep(
    {
      type: joint.shapes.flo.NODE_TYPE,
      position: {x: 0, y: 0},
      size: {width: IMAGE_W, height: IMAGE_H},
      attrs: {
        '.': {magnet: false},
        '.box': {
          refWidth: 1,
          refHeight: 1,
          rx: NODE_ROUNDED_CORNER,
          ry: NODE_ROUNDED_CORNER
        },
        '.palette-entry-name-label': {
          refX: 10, // jointjs specific: relative position to ref'd element
          refY: 0.5,
          'y-alignment': 'middle',
          ref: '.box' // jointjs specific: element for ref-x, ref-y
        },
        '.name-label': {
          refX: 0.5,
          refY: 0.5,
          'y-alignment': 'middle',
          'x-alignment': 'middle',
          ref: '.box'
        },
        '.type-label': {
          refX: '50%',
          refY: 0.5,
          refY2: 2,
          'y-alignment': 'top',
          'x-alignment': 'middle',
          ref: '.box', // jointjs specific: element for ref-x, ref-y
          text: 'UNRESOLVED'
        },
        '.type-label-bg': {
          ref: '.type-label',
          refX: -10,
          refY: -3,
          refWidth: 20,
          rx: 11,
          ry: 11,
          refHeight: 6
        },
        '.error-marker': {
          width: ERROR_MARKER_SIZE.width,
          height: ERROR_MARKER_SIZE.height,
          ref: '.box',
          refX: '100%',
          refX2: -ERROR_MARKER_SIZE.width,
          refY: 0
        },
        '.output-port': {
          port: 'output',
          magnet: true
        },
        '.port-outer-circle-output': {
          ref: '.box',
          refCx: '50%',
          refCy: '100%',
          r: PORT_RADIUS,
          class: 'port-outer-circle-output flo-port'
        },
        '.port-inner-circle-output': {
          ref: '.box',
          refCx: '50%',
          refCy: '100%',
          r: PORT_RADIUS - 4,
          class: 'port-inner-circle-output flo-port-inner-circle'
        },
        '.input-port': {
          port: 'input',
          magnet: true
        },
        '.port-outer-circle-input': {
          ref: '.box',
          refCx: '50%',
          refCy: 0,
          r: PORT_RADIUS,
          class: 'port-outer-circle-input flo-port'
        },
        '.port-inner-circle-input': {
          ref: '.box',
          refCx: '50%',
          refCy: 0,
          r: PORT_RADIUS - 4,
          class: 'port-inner-circle-input flo-port-inner-circle'
        },
        '.select-outline': {
          ref: '.box',
          refWidth: 1,
          refHeight: 1,
          rx: NODE_ROUNDED_CORNER,
          ry: NODE_ROUNDED_CORNER
        },
        '.options-handle': {
          text: 'Options',
          ref: '.box',
          refX: 0,
          refY: -5,
          yAlignment: 'bottom'
        },
        '.delete-handle': {
          text: 'Delete',
          ref: '.box',
          refX: '100%',
          refY: -5,
          yAlignment: 'bottom',
          textAnchor: 'end'
        },
        '.shape': {}
      }
    },
    joint.shapes.basic.Generic.prototype.defaults
  )
});

export const BatchStartShape = joint.shapes.basic.Generic.extend({
  defaults: defaultsDeep(
    {
      size: START_NODE_SIZE,
      attrs: {
        '.start-outer': {
          magnet: true,
          port: 'output',
          r: START_NODE_SIZE.width / 2,
          refCx: 0.5,
          refCy: 0.5
        },
        '.start-inner': {
          r: START_NODE_SIZE.width / 4,
          refCx: 0.5,
          refCy: 0.5
        },
        '.select-outline': {
          r: START_NODE_SIZE.width / 2,
          refCx: 0.5,
          refCy: 0.5
        },
        '.name-label': {
          ref: '.start-outer',
          refX: 0.5,
          refY: -5,
          xAlignment: 'middle',
          yAlignment: 'bottom'
        },
        '.options-handle': {
          ref: '.start-outer',
          text: 'Options',
          refX: '100%',
          refX2: 10,
          refY: '50%',
          yAlignment: 'middle'
        },
        '.error-marker': {
          width: ERROR_MARKER_SIZE.width,
          height: ERROR_MARKER_SIZE.height,
          ref: '.start-outer',
          refX: '100%',
          refY: 0
        },
        '.shape': {}
      }
    },
    joint.shapes.basic.Generic.prototype.defaults
  )
});

export const BatchEndShape = joint.shapes.basic.Generic.extend({
  defaults: defaultsDeep(
    {
      size: END_NODE_SIZE,
      attrs: {
        '.end-inner': {
          refRx: '35%',
          refRy: '35%',
          refCx: 0.5,
          refCy: 0.5
        },
        '.end-outer': {
          refRx: '50%',
          refRy: '50%',
          refCx: 0.5,
          refCy: 0.5,
          magnet: true,
          port: 'input'
        },
        '.name-label': {
          refX: '50%',
          refY: '100%',
          refY2: 15,
          xAlignment: 'middle',
          yAlignment: 'top',
          ref: '.end-outer'
        },
        '.select-outline': {
          refRx: '50%',
          refRy: '50%',
          refCx: 0.5,
          refCy: 0.5
        },
        '.error-marker': {
          width: ERROR_MARKER_SIZE.width,
          height: ERROR_MARKER_SIZE.height,
          ref: '.shape',
          refX: '100%',
          refY: '100%'
          // refX2: - ERROR_MARKER_SIZE.width,
        },
        '.shape': {}
      }
    },
    joint.shapes.basic.Generic.prototype.defaults
  )
});

export const BatchSyncShape = joint.shapes.basic.Generic.extend({
  defaults: defaultsDeep(
    {
      type: joint.shapes.flo.NODE_TYPE,
      size: {width: 50, height: 20},
      attrs: {
        '.box': {
          refRx: '20%',
          refRy: '50%',
          refWidth: '100%',
          refHeight: '100%'
        },
        '.select-outline': {
          refRx: '20%',
          refRy: '50%',
          refWidth: '100%',
          refHeight: '100%'
        },
        '.name-label': {
          refX: '50%',
          refY: '50%',
          xAlignment: 'middle',
          yAlignment: 'middle',
          ref: '.box'
        },
        '.palette-entry-name-label': {
          refX: '50%',
          refY: '50%',
          xAlignment: 'middle',
          yAlignment: 'middle',
          ref: '.box'
        },
        '.delete-handle': {
          text: 'Delete',
          ref: '.box',
          refX: '100%',
          refY: -5,
          yAlignment: 'bottom',
          textAnchor: 'end'
        },
        '.error-marker': {
          width: ERROR_MARKER_SIZE.width,
          height: ERROR_MARKER_SIZE.height,
          ref: '.box',
          refX: '100%',
          refX2: -5 - ERROR_MARKER_SIZE.width,
          refY: 5
        },
        '.output-port': {
          port: 'output',
          magnet: true
        },
        '.port-outer-circle-output': {
          ref: '.box',
          refCx: '50%',
          refCy: '100%',
          r: PORT_RADIUS,
          class: 'port-outer-circle-output flo-port'
        },
        '.port-inner-circle-output': {
          ref: '.box',
          refCx: '50%',
          refCy: '100%',
          r: PORT_RADIUS - 3,
          class: 'port-inner-circle-output flo-port-inner-circle'
        },
        '.input-port': {
          port: 'input',
          magnet: true
        },
        '.port-outer-circle-input': {
          ref: '.box',
          refCx: '50%',
          refCy: 0,
          r: PORT_RADIUS,
          class: 'port-outer-circle-input flo-port'
        },
        '.port-inner-circle-input': {
          ref: '.box',
          refCx: '50%',
          refCy: 0,
          r: PORT_RADIUS - 3,
          class: 'port-inner-circle-input flo-port-inner-circle'
        },
        '.shape': {}
      }
    },
    joint.shapes.basic.Generic.prototype.defaults
  )
});

export const BatchLink = joint.shapes.flo.Link.extend({
  toolMarkup: [
    '<g class="link-tool composed-task">',
    '<g class="tool-remove" event="remove">',
    '<rect class="link-tools-container" width="47" height="22" transform="translate(-11 -11)"/>',
    '<circle r="11" />',
    '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 ' +
      '16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
    '<titleModal>Remove link.</titleModal>',
    '</g>',
    '<g class="tool-options" event="link:options">',
    '<circle r="11" transform="translate(25)"/>',
    '<path fill="white" transform="scale(.7) translate(20, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-' +
      '1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-' +
      '1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,' +
      '0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,' +
      '4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,' +
      '15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,' +
      '0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,' +
      '0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,' +
      '1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,' +
      '20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,' +
      '18.689,18.689,20.871,16,20.871z"/>',
    '<titleModal>Properties</titleModal>',
    '</g>',
    '</g>'
  ].join(''),

  arrowheadMarkup: [
    '<g class="marker-arrowhead-group marker-arrowhead-group-<%= end %>">',
    '<path class="marker-arrowhead" end="<%= end %>" d="M 16 0 L 0 8 L 16 16 z" />',
    '</g>'
  ].join(''),

  vertexMarkup: [
    '<g class="marker-vertex-group" transform="translate(<%= x %>, <%= y %>)">',
    '<circle class="marker-vertex" idx="<%= idx %>" r="8" />',
    '<path class="marker-vertex-remove-area" idx="<%= idx %>" d="M16,5.333c-7.732,0-14,4.701-14,10.5c0,1.982,0.741,' +
      '3.833,2.016,5.414L2,25.667l5.613-1.441c2.339,1.317,5.237,2.107,8.387,2.107c7.732,0,14-4.701,14-10.5C30,10.034,' +
      '23.732,5.333,16,5.333z" transform="translate(5, -33)"/>',
    '<path class="marker-vertex-remove" idx="<%= idx %>" transform="scale(.8) translate(8.5, -37)" d="M24.778,21.419 ' +
      '19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 ' +
      '10.946,24.248 16.447,18.746 21.948,24.248z">',
    '<titleModal>Remove vertex.</titleModal>',
    '</path>',
    '</g>'
  ].join(''),

  defaults: defaultsDeep(
    {
      attrs: {
        '.connection': {'stroke-linecap': 'round'},
        '.marker-target': {d: 'M 5 0 L 0.67, 2.5 L 5 5 z', 'stroke-width': 3},
        props: {}
      }
    },
    joint.shapes.flo.Link.prototype.defaults
  )
});
