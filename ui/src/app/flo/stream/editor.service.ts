/*
 * Copyright 2015-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Injectable} from '@angular/core';
import {Flo, Constants} from 'spring-flo';
import {dia, g} from 'jointjs';
import * as _joint from 'jointjs';
import {ApplicationType} from '../../shared/model/app.model';
import {Utils as SharedUtils} from '../shared/support/utils';

const joint: any = _joint;

const NODE_DROPPING = false;

/**
 * Editor Service for Flo based Stream Definition Graph editor.
 *
 * @author Alex Boyko
 * @author Andy Clement
 */
@Injectable()
export class EditorService implements Flo.Editor {
  static VALMSG_NEEDS_OUTPUT_CONNECTION = 'Should direct its output to an app';
  static VALMSG_NEEDS_INPUT_CONNECTION = 'Should have an input connection from an app';
  static VALMSG_DESTINATION_SHOULD_BE_NAMED = 'Destination should be named';
  static VALMSG_DESTINATION_CANNOT_BE_TAPPED = 'Cannot tap into a destination app';
  static VALMSG_TAPSOURCE_CANNOT_BE_TAPPED = 'Cannot tap into a tap source';
  static VALMSG_SOURCES_MUST_BE_AT_START = 'Sources must appear at the start of a stream';
  static VALMSG_SINK_SHOULD_BE_AT_END = 'Sink should be at the end of a stream';
  static VALMSG_ONLY_ONE_NON_TAPLINK_FROM_SOURCE = 'Only one non-tap link allowed from source';
  static VALMSG_ONLY_ONE_NON_TAPLINK_FROM_PROCESSOR = 'Only one non-tap link allowed from processor';
  static VALMSG_NEEDS_NONTAP_OUTPUT_CONNECTION = 'Element needs exactly one non-tapping output connection';

  STREAM_PALETTE_WIDTH = 1;

  constructor() {}

  interactive: dia.CellView.InteractivityOptions = {
    vertexAdd: false
  };

  get highlighting(): any {
    return {
      connecting: {
        name: 'addParentClass',
        options: {
          className: 'connecting'
        }
      },
      default: {
        name: 'addClass',
        options: {
          className: 'highlighted'
        }
      }
    };
  }

  validateLink(
    flo: Flo.EditorContext,
    cellViewS: dia.ElementView,
    magnetS: SVGElement,
    cellViewT: dia.ElementView,
    magnetT: SVGElement,
    isSource: boolean,
    linkView: dia.LinkView
  ): boolean {
    let idx: number;

    // Prevent linking FROM node input port
    if (magnetS && magnetS.getAttribute('port') === 'input') {
      return false;
    }

    // Prevent linking from output port to input port of same element.
    if (cellViewS === cellViewT) {
      return false;
    }

    // Prevent linking TO node output port
    if (magnetT && magnetT.getAttribute('port') === 'output') {
      return false;
    }

    const graph = flo.getGraph();

    if (cellViewS.model.attr) {
      const currentSourceLinks = graph.getConnectedLinks(cellViewS.model, {outbound: true});
      idx = currentSourceLinks.indexOf(linkView.model);
      // For a second link we will see:
      // Index into outgoing source links for this link = 1 link count = 2
      // if (idx > 0) {
      //     // Dash the link
      //     _.each(linkView.el.querySelectorAll('.connection, .marker-source, .marker-target'), function(connection) {
      //         joint.V(connection).addClass('tapped-output-from-app');
      //     });
      // }
    }

    if (cellViewS.model.prop('metadata') && cellViewT.model.prop('metadata')) {
      const targetGroup = cellViewT.model.prop('metadata/group');

      // Target is a SOURCE node? Disallow link!
      // Target is APP type node? Disallow link!
      if (
        targetGroup === ApplicationType[ApplicationType.source] ||
        targetGroup === ApplicationType[ApplicationType.app]
      ) {
        return false;
      }
      // Target is an explicit tap? Disallow link!
      if (cellViewT.model.prop('metadata/name') === 'tap') {
        return false;
      }

      const sourceGroup = cellViewS.model.prop('metadata/group');
      // SINK, TASK, APP cannot have outgoing links
      if (
        sourceGroup === ApplicationType[ApplicationType.sink] ||
        sourceGroup === ApplicationType[ApplicationType.task] ||
        sourceGroup === ApplicationType[ApplicationType.app]
      ) {
        return false;
      }

      const targetIncomingLinks = graph.getConnectedLinks(cellViewT.model, {inbound: true});
      idx = targetIncomingLinks.indexOf(linkView.model);
      if (idx >= 0) {
        targetIncomingLinks.splice(idx, 1);
      }
      const outgoingSourceLinks = graph.getConnectedLinks(cellViewS.model, {outbound: true});
      idx = outgoingSourceLinks.indexOf(linkView.model);
      if (idx >= 0) {
        outgoingSourceLinks.splice(idx, 1);
      }

      if (targetIncomingLinks.length > 0) {
        // It is ok if the target is a destination
        if (cellViewT.model.prop('metadata/name') !== 'destination') {
          return false;
        }
      }

      if (outgoingSourceLinks.length > 0) {
        // Make sure there is no link between this source and target already
        const anotherLink = outgoingSourceLinks
          .map(l => l.get('target').id)
          .filter(id => typeof id === 'string')
          .map(id => graph.getCell(id))
          .find(t => t && t === cellViewT.model);
        if (anotherLink) {
          return false;
        }

        // Invalid if output-port has more than one outgoing link (if not destination)
        // if (magnetS.getAttribute('class') === 'output-port' &&
        //     cellViewS.model.prop('metadata/name') !== 'destination') {
        //     for (i = 0; i < outgoingSourceLinks.length; i++) {
        //         var selector = outgoingSourceLinks[i].get('source').selector;
        //         // Another link from the 'output-port' is present
        //         if (selector) {
        //             var port = cellViewS.el.querySelector(selector);
        //             if (port && port.getAttribute('class') === 'output-port') {
        //                 return false;
        //             }
        //         }
        //     }
        // }
      }

      // All checks passed, valid connection.
      return true;
    }
  }

  private getOutgoingStreamLinks(graph: dia.Graph, node: dia.Element): Array<dia.Link> {
    // !node only possible if call is occurring during link drawing (one end connected but not the other)
    if (node) {
      graph
        .getConnectedLinks(node, {outbound: true})
        .filter(l => l.get('source') && l.get('source').port === 'output' && !l.attr('props/isTapLink'));
    }
    return [];
  }

  calculateDragDescriptor(
    flo: Flo.EditorContext,
    draggedView: dia.CellView,
    viewUnderMouse: dia.CellView,
    point: g.Point,
    sourceComponent: string
  ): Flo.DnDDescriptor {
    const source = draggedView.model;
    const paper = flo.getPaper();
    const targetUnderMouse = viewUnderMouse ? viewUnderMouse.model : undefined;
    // If node dropping not enabled then short-circuit
    if (
      !NODE_DROPPING &&
      !(
        targetUnderMouse instanceof joint.dia.Link &&
        targetUnderMouse.prop('metadata/name') !== 'tap' &&
        targetUnderMouse.prop('metadata/name') !== 'destination'
      )
    ) {
      return {
        sourceComponent,
        source: {
          view: draggedView
        }
      };
    }
    // check if it's a tap being dragged
    if (targetUnderMouse instanceof joint.dia.Element && source.prop('metadata/name') === 'tap') {
      return {
        sourceComponent,
        source: {
          view: draggedView
        },
        target: {
          view: viewUnderMouse
        }
      };
    }

    // Find closest port
    const range = 30;
    const graph = flo.getGraph();
    let closestData: Flo.DnDDescriptor;
    let minDistance = Number.MAX_VALUE;
    const hasIncomingPort =
      draggedView.model.attr('.input-port') && draggedView.model.attr('.input-port/display') !== 'none';
    // Ignore tap-port for the dragged view. Only allow making connections to/from input and output port for node-on-node DnD
    const hasOutgoingPort =
      draggedView.model.attr('.output-port') && draggedView.model.attr('.output-port/display') !== 'none';
    if (!hasIncomingPort && !hasOutgoingPort) {
      return;
    }
    const elements = graph.findModelsInArea(joint.g.rect(point.x - range, point.y - range, 2 * range, 2 * range));
    if (Array.isArray(elements)) {
      elements.forEach(model => {
        const view = paper.findViewByModel(model);
        if (view && view !== draggedView && model instanceof joint.dia.Element) {
          const targetHasIncomingPort =
            view.model.attr('.input-port') && view.model.attr('.input-port/display') !== 'none';
          // 2 output ports: output-port and tap-port
          const targetHasOutgoingPort =
            (view.model.attr('.output-port') && view.model.attr('.output-port/display') !== 'none') ||
            (view.model.attr('.tap-port') && view.model.attr('.tap-port/display') !== 'none');
          view.$('[magnet]').each((index, magnet) => {
            const port = magnet.getAttribute('port');
            if (
              (port === 'input' && targetHasIncomingPort && hasOutgoingPort) ||
              (port === 'output' && targetHasOutgoingPort && hasIncomingPort)
            ) {
              const bbox = joint.V(magnet).bbox(false, paper.viewport);
              const distance = point.distance({
                x: bbox.x + bbox.width / 2,
                y: bbox.y + bbox.height / 2
              });
              if (distance < range && distance < minDistance) {
                minDistance = distance;
                closestData = {
                  sourceComponent,
                  source: {
                    cssClassSelector: port === 'output' ? '.input-port' : '.output-port',
                    view: draggedView
                  },
                  target: {
                    cssClassSelector: '.' + magnet.getAttribute('class').split(/\s+/)[0],
                    view
                  },
                  range: minDistance
                };
              }
            }
          });
        }
      });
    }
    if (closestData) {
      return closestData;
    }

    // Check if drop on a link is allowed
    const sourceType = source.prop('metadata/name');
    const sourceGroup = source.prop('metadata/group');
    if (
      targetUnderMouse instanceof joint.dia.Link &&
      !(sourceType === 'destination' || sourceGroup === 'sink' || sourceGroup === 'source') &&
      graph.getConnectedLinks(source).length === 0
    ) {
      return {
        sourceComponent,
        source: {
          view: draggedView
        },
        target: {
          view: paper.findViewByModel(targetUnderMouse)
        }
      };
    }
  }

  protected validateSource(
    element: dia.Element,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>,
    tap: Array<dia.Link>,
    errors: Array<Flo.Marker>
  ): void {
    if (incoming.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_SOURCES_MUST_BE_AT_START,
        range: element.attr('range')
      });
    }
    if (outgoing.length === 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_NEEDS_OUTPUT_CONNECTION,
        range: element.attr('range')
      });
    } else {
      const nontaplinks = this.countNonTapLinks(outgoing);
      if (nontaplinks === 0) {
        errors.push({
          severity: Flo.Severity.Error,
          message: EditorService.VALMSG_NEEDS_NONTAP_OUTPUT_CONNECTION,
          range: element.attr('range')
        });
      } else if (nontaplinks > 1) {
        errors.push({
          severity: Flo.Severity.Error,
          message: EditorService.VALMSG_ONLY_ONE_NON_TAPLINK_FROM_SOURCE,
          range: element.attr('range')
        });
      }
    }
  }

  private countNonTapLinks(links: Array<dia.Link>): number {
    let nonTapLinkCount = 0;
    for (let l = 0; l < links.length; l++) {
      const link = links[l];
      if (!this.isTapLink(link)) {
        nonTapLinkCount++;
      }
    }
    return nonTapLinkCount;
  }

  protected validateProcessor(
    element: dia.Element,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>,
    tap: Array<dia.Link>,
    errors: Array<Flo.Marker>
  ): void {
    if (incoming.length !== 1) {
      errors.push({
        severity: Flo.Severity.Error,
        message:
          incoming.length === 0 ? EditorService.VALMSG_NEEDS_INPUT_CONNECTION : 'Input should come from one app only',
        range: element.attr('range')
      });
    }
    if (outgoing.length === 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_NEEDS_OUTPUT_CONNECTION,
        range: element.attr('range')
      });
    } else {
      const nontaplinks = this.countNonTapLinks(outgoing);
      if (nontaplinks === 0) {
        errors.push({
          severity: Flo.Severity.Error,
          message: EditorService.VALMSG_NEEDS_NONTAP_OUTPUT_CONNECTION,
          range: element.attr('range')
        });
      } else if (nontaplinks > 1) {
        errors.push({
          severity: Flo.Severity.Error,
          message: EditorService.VALMSG_ONLY_ONE_NON_TAPLINK_FROM_PROCESSOR,
          range: element.attr('range')
        });
      }
    }
  }

  protected validateSink(
    element: dia.Element,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>,
    tap: Array<dia.Link>,
    errors: Array<Flo.Marker>
  ): void {
    if (incoming.length !== 1) {
      errors.push({
        severity: Flo.Severity.Error,
        message:
          incoming.length === 0 ? EditorService.VALMSG_NEEDS_INPUT_CONNECTION : 'Input should come from one app only',
        range: element.attr('range')
      });
    }
    if (outgoing.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_SINK_SHOULD_BE_AT_END,
        range: element.attr('range')
      });
    }
  }

  protected validateTask(
    element: dia.Element,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>,
    tap: Array<dia.Link>,
    errors: Array<Flo.Marker>
  ): void {
    if (incoming.length !== 1) {
      errors.push({
        severity: Flo.Severity.Error,
        message:
          incoming.length === 0 ? EditorService.VALMSG_NEEDS_INPUT_CONNECTION : 'Input should come from one app only',
        range: element.attr('range')
      });
    }
    if (outgoing.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: 'Task should be at the end of a stream',
        range: element.attr('range')
      });
    }
    if (tap.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: 'Cannot tap into a task app',
        range: element.attr('range')
      });
    }
  }

  protected validateTap(
    element: dia.Element,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>,
    tap: Array<dia.Link>,
    errors: Array<Flo.Marker>
  ): void {
    if (incoming.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: 'Tap must appear at the start of a stream',
        range: element.attr('range')
      });
    }
    if (outgoing.length === 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_NEEDS_OUTPUT_CONNECTION,
        range: element.attr('range')
      });
    }
    if (tap.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_TAPSOURCE_CANNOT_BE_TAPPED,
        range: element.attr('range')
      });
    }
  }

  protected validateDestination(
    element: dia.Element,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>,
    tapLinks: Array<dia.Link>,
    errors: Array<Flo.Marker>
  ): void {
    if (tapLinks.length !== 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_DESTINATION_CANNOT_BE_TAPPED,
        range: element.attr('range')
      });
    }
    if (!element.attr('props/name')) {
      errors.push({
        severity: Flo.Severity.Error,
        message: EditorService.VALMSG_DESTINATION_SHOULD_BE_NAMED,
        range: element.attr('range')
      });
    }
  }

  private isTapLink(link): boolean {
    return link.attr('props/isTapLink') === true;
  }

  private validateConnectedLinks(graph: dia.Graph, element: dia.Element, errors: Array<Flo.Marker>): void {
    const group = element.prop('metadata/group');
    const type = element.prop('metadata/name');
    const incoming: Array<dia.Link> = [];
    const outgoing: Array<dia.Link> = [];
    const tap: Array<dia.Link> = [];
    const invalidIncoming: Array<dia.Link> = [];
    const invalidOutgoing: Array<dia.Link> = [];
    let port: string;

    // console.log(`Validating '${group}' of '${type}'`);
    graph.getConnectedLinks(element).forEach(link => {
      if (link.get('source').id === element.id) {
        // console.log('Outgoing link end ' + JSON.stringify(link.get('source')));
        port = link.get('source').port;
        if (port === 'output') {
          outgoing.push(link);
        } else {
          invalidOutgoing.push(link);
        }
        if (this.isTapLink(link)) {
          tap.push(link);
        }
      } else if (link.get('target').id === element.id) {
        // console.log('Incoming link end ' + JSON.stringify(link.get('target')));
        port = link.get('target').port;
        if (port === 'input') {
          incoming.push(link);
        } else {
          invalidIncoming.push(link);
        }
      }
    });

    // console.log('Outgoing number ' + outgoing.length);
    // console.log('Incoming number ' + incoming.length);

    if (invalidIncoming.length > 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: 'Invalid incoming link' + (invalidIncoming.length > 1 ? 's' : ''),
        range: element.attr('range')
      });
    }

    if (invalidOutgoing.length > 0) {
      errors.push({
        severity: Flo.Severity.Error,
        message: 'Invalid outgoing link' + (invalidOutgoing.length > 1 ? 's' : ''),
        range: element.attr('range')
      });
    }

    switch (group) {
      case ApplicationType[ApplicationType.source]:
        this.validateSource(element, incoming, outgoing, tap, errors);
        break;
      case ApplicationType[ApplicationType.processor]:
        this.validateProcessor(element, incoming, outgoing, tap, errors);
        break;
      case ApplicationType[ApplicationType.sink]:
        this.validateSink(element, incoming, outgoing, tap, errors);
        break;
      case ApplicationType[ApplicationType.task]:
        this.validateTask(element, incoming, outgoing, tap, errors);
        break;
      default:
        if (type === 'tap') {
          this.validateTap(element, incoming, outgoing, tap, errors);
        } else if (type === 'destination') {
          this.validateDestination(element, incoming, outgoing, tap, errors);
        }
    }

    this.validatePortLinks(element, errors, incoming, outgoing);
  }

  protected validatePortLinks(
    element: dia.Element,
    errors: Array<Flo.Marker>,
    incoming: Array<dia.Link>,
    outgoing: Array<dia.Link>
  ): void {
    // TODO This validation below is commented out until multiple ports support is a go
    // const incomingGroups = _.groupBy(incoming, link => link.attr('props/inputChannel') || '');
    // Object.keys(incomingGroups).forEach(channel => {
    //   const group = incomingGroups[channel];
    //
    //   // Error on unresolved channels not present in metamodel
    //   if (channel && element.prop('metadata') instanceof AppMetadata) {
    //     const inputChannels = (<AppMetadata> element.prop('metadata')).inputChannels;
    //     if (!Array.isArray(inputChannels) || inputChannels.indexOf(channel) < 0) {
    //       errors.push({
    //         severity: Flo.Severity.Error,
    //         message: `Incoming link to unresolved channel '${channel}'`,
    //         range: element.attr('range')
    //       });
    //     }
    //   }
    //
    //   // More than one incoming primary link on the same channel is disallowed
    //   const primaryLinks = group.filter(l => !l.attr('props/isTapLink'));
    //   if (primaryLinks.length > 1) {
    //     const label = channel ? `More than one incoming non-tap links to channel ${channel}`
    //       : `More than one incoming non-tap link to element`;
    //     errors.push({
    //       severity: Flo.Severity.Error,
    //       message: label,
    //       range: element.attr('range')
    //     });
    //   }
    // });
    //
    // const outgoingGroups = _.groupBy(outgoing, link => link.attr('props/outputChannel') || '');
    // Object.keys(outgoingGroups).forEach(channel => {
    //   const group = outgoingGroups[channel];
    //
    //   // Error on unresolved channels not present in metamodel
    //   if (channel && element.prop('metadata') instanceof AppMetadata) {
    //     const outputChannels = (<AppMetadata> element.prop('metadata')).outputChannels;
    //     if (!Array.isArray(outputChannels) || outputChannels.indexOf(channel) < 0) {
    //       errors.push({
    //         severity: Flo.Severity.Error,
    //         message: `Outgoing link from unresolved channel '${channel}'`,
    //         range: element.attr('range')
    //       });
    //     }
    //   }
    //
    //   // More than one outgoing primary link on the same channel is disallowed
    //   const primaryLinks = group.filter(l => !l.attr('props/isTapLink'));
    //   if (primaryLinks.length > 1) {
    //     const label = channel ? `More than one outgoing non-tap links from channel ${channel}`
    //       : `More than one outgoing non-tap link from element`;
    //     errors.push({
    //       severity: Flo.Severity.Error,
    //       message: label,
    //       range: element.attr('range')
    //     });
    //   }
    // });
  }

  /**
   * Verify any supplied properties are allowed according to the metadata specification
   * for the element.
   */
  protected validateProperties(element: dia.Element, markers: Array<Flo.Marker>): Promise<void> {
    // TODO: Properties not validated until something decided about boot properties that are hidden but valid
    return new Promise(resolve => {
      // const specifiedProperties = element.attr('props');
      // if (specifiedProperties) {
      //     const propertiesRanges = element.attr('propertiesranges');
      //     const appSchema = element.prop('metadata');
      //     appSchema.properties().then(appSchemaProperties => {
      //         if (!appSchemaProperties) {
      //             appSchemaProperties = new Map<string, Flo.PropertyMetadata>();
      //         }
      //         Object.keys(specifiedProperties).forEach(propertyName => {
      //             const allProperties: Flo.PropertyMetadata[] = Array.from(appSchemaProperties.values());
      //             const property = allProperties.find(p => p.name === propertyName || p.id === propertyName);
      //             if (!property) {
      //                 const range = propertiesRanges ? propertiesRanges[propertyName] : null;
      //                 markers.push({
      //                     severity: Flo.Severity.Error,
      //                     message: 'unrecognized option \'' + propertyName + '\' for app \'' +
      //                                 element.prop('metadata/name') + '\'',
      //                     range: range
      //                 });
      //             }
      //         });
      //         resolve();
      //     });
      // } else {
      // nothing to check, simply resolve the promise
      resolve();
      // }
    });
  }

  private validateMetadata(element: dia.Cell, errors: Array<Flo.Marker>): void {
    // Unresolved elements validation
    if (!element.prop('metadata') || SharedUtils.isUnresolved(element)) {
      let msg = "Unknown element '" + element.prop('metadata/name') + "'";
      if (element.prop('metadata/group')) {
        msg += " from group '" + element.prop('metadata/group') + "'.";
      }
      errors.push({
        severity: Flo.Severity.Error,
        message: msg,
        range: element.attr('range')
      });
    }
  }

  private validateNode(graph: dia.Graph, element: dia.Element): Promise<Array<Flo.Marker>> {
    return new Promise(resolve => {
      const markers: Array<Flo.Marker> = [];
      this.validateMetadata(element, markers);
      this.validateConnectedLinks(graph, element, markers);
      this.validateProperties(element, markers).then(() => {
        resolve(markers);
      });
    });
  }

  validate(graph: dia.Graph, dsl: string, flo: Flo.EditorContext): Promise<Map<string | number, Flo.Marker[]>> {
    return new Promise(resolve => {
      const markers: Map<string | number, Array<Flo.Marker>> = new Map();
      const promises: Promise<void>[] = [];
      graph
        .getElements()
        .filter(e => !e.get('parent') && e.prop('metadata'))
        .forEach(e => {
          promises.push(
            new Promise<void>(nodeFinished => {
              this.validateNode(graph, e).then(result => {
                markers.set(e.id, result);
                nodeFinished();
              });
            })
          );
        });
      Promise.all(promises).then(() => {
        resolve(markers);
      });
    });
  }

  private repairDamage(flo: Flo.EditorContext, node: dia.Element): void {
    /*
     * remove incoming, outgoing links and cache their sources and targets not equal to current node
     */
    const sources: Array<string> = [];
    const targets: Array<string> = [];
    const i = 0;
    flo
      .getGraph()
      .getConnectedLinks(node)
      .forEach(link => {
        const targetId = link.get('target').id;
        const sourceId = link.get('source').id;
        if (targetId === node.id) {
          link.remove();
          sources.push(sourceId);
        } else if (sourceId === node.id) {
          link.remove();
          targets.push(targetId);
        }
      });
    /*
     * best attempt to connect source and targets bypassing the node
     */
    if (sources.length === 1) {
      const source = sources[0];
      if (flo.getGraph().getCell(source).attr('.output-port')) {
        targets
          .filter(t => flo.getGraph().getCell(t).attr('.input-port'))
          .forEach(target =>
            flo.createLink(
              {
                id: source,
                magnet: '.output-port',
                port: 'output'
              },
              {
                id: target,
                magnet: '.input-port',
                port: 'input'
              }
            )
          );
      }
    } else if (targets.length === 1) {
      const target = targets[0];
      if (flo.getGraph().getCell(target).attr('.input-port')) {
        sources
          .filter(s => flo.getGraph().getCell(s).attr('.output-port'))
          .forEach(source =>
            flo.createLink(
              {
                id: sources[i],
                magnet: '.output-port',
                port: 'output'
              },
              {
                id: target,
                magnet: '.input-port',
                port: 'input'
              }
            )
          );
      }
    }
  }

  /**
   * Check if node being dropped and drop target node next to each other such that they won't be swapped by the drop
   */
  private canSwap(flo: Flo.EditorContext, dropee: dia.Element, target: dia.Element, side: string): boolean {
    let i: number;
    let targetId: string;
    let sourceId: string;
    let noSwap = dropee.id === target.id;
    if (dropee === target) {
      // Shouldn't happen
    }
    const links = flo.getGraph().getConnectedLinks(dropee);
    for (i = 0; i < links.length && !noSwap; i++) {
      targetId = links[i].get('target').id;
      sourceId = links[i].get('source').id;
      noSwap =
        (side === 'left' && targetId === target.id && sourceId === dropee.id) ||
        (side === 'right' && targetId === dropee.id && sourceId === target.id);
    }
    return !noSwap;
  }

  preDelete(flo: Flo.EditorContext, cell: dia.Cell): any {
    if (cell instanceof joint.dia.Element) {
      this.repairDamage(flo, cell as dia.Element);
    }
    return true;
  }

  private moveNodeOnNode(
    flo: Flo.EditorContext,
    node: dia.Element,
    pivotNode: dia.Element,
    side: string,
    shouldRepairDamage: boolean
  ): void {
    side = side || 'left';
    if (this.canSwap(flo, node, pivotNode, side)) {
      if (side === 'left') {
        const sources: Array<string> = [];
        if (shouldRepairDamage) {
          this.repairDamage(flo, node);
        }
        flo
          .getGraph()
          .getConnectedLinks(pivotNode, {inbound: true})
          .forEach(link => {
            sources.push(link.get('source').id);
            link.remove();
          });
        // TODO: replace selector CSS class with the result of view.getSelector(...)
        sources.forEach(source => {
          flo.createLink(
            {
              id: source,
              magnet: '.output-port',
              port: 'output'
            },
            {
              id: node.id,
              magnet: '.input-port',
              port: 'input'
            }
          );
        });
        flo.createLink(
          {
            id: node.id,
            magnet: '.output-port',
            port: 'output'
          },
          {
            id: pivotNode.id,
            magnet: '.input-port',
            port: 'input'
          }
        );
      } else if (side === 'right') {
        const targets: Array<string> = [];
        if (shouldRepairDamage) {
          this.repairDamage(flo, node);
        }
        flo
          .getGraph()
          .getConnectedLinks(pivotNode, {outbound: true})
          .forEach(link => {
            targets.push(link.get('target').id);
            link.remove();
          });
        // TODO: replace selector CSS class with the result of view.getSelector(...)
        targets.forEach(target => {
          flo.createLink(
            {
              id: node.id,
              magnet: '.output-port',
              port: 'output'
            },
            {
              id: target,
              magnet: '.input-port',
              port: 'input'
            }
          );
        });
        flo.createLink(
          {
            id: pivotNode.id,
            magnet: '.output-port',
            port: 'output'
          },
          {
            id: node.id,
            magnet: '.input-port',
            port: 'input'
          }
        );
      }
    }
  }

  private moveNodeOnLink(
    flo: Flo.EditorContext,
    node: dia.Element,
    link: dia.Link,
    shouldRepairDamage?: boolean
  ): void {
    const source = link.get('source').id;
    const target = link.get('target').id;

    const sourceTap = link.get('source').port === 'tap';

    if (shouldRepairDamage) {
      this.repairDamage(flo, node);
    }
    link.remove();

    if (source) {
      flo.createLink(
        {
          id: source,
          magnet: sourceTap ? '.tap-port' : '.output-port',
          port: sourceTap ? 'tap' : 'output'
        },
        {
          id: node.id,
          magnet: '.input-port',
          port: 'input'
        }
      );
    }
    if (target) {
      flo.createLink(
        {
          id: node.id,
          magnet: '.output-port',
          port: 'output'
        },
        {
          id: target,
          magnet: '.input-port',
          port: 'input'
        }
      );
    }
  }

  handleNodeDropping(flo: Flo.EditorContext, dragDescriptor: Flo.DnDDescriptor): void {
    let relinking = dragDescriptor.sourceComponent === Constants.PALETTE_CONTEXT;
    const graph = flo.getGraph();
    const source = dragDescriptor.source ? dragDescriptor.source.view.model : undefined;
    const target = dragDescriptor.target ? dragDescriptor.target.view.model : undefined;
    const type = source.prop('metadata/name');
    // NODE DROPPING TURNED OFF FOR NOW
    if (NODE_DROPPING && target instanceof joint.dia.Element && target.prop('metadata/name')) {
      if (dragDescriptor.target.cssClassSelector === '.output-port') {
        this.moveNodeOnNode(flo, source as dia.Element, target as dia.Element, 'right', true);
        relinking = true;
      } else if (dragDescriptor.target.cssClassSelector === '.input-port') {
        this.moveNodeOnNode(flo, source as dia.Element, target as dia.Element, 'left', true);
        relinking = true;
      } else if (dragDescriptor.target.cssClassSelector === '.tap-port') {
        // TODO: replace selector CSS class with the result of view.getSelector(...)
        flo.createLink(
          {
            id: target.id,
            magnet: dragDescriptor.target.cssClassSelector,
            port: 'output'
          },
          {
            id: source.id,
            magnet: dragDescriptor.source.cssClassSelector,
            port: 'input'
          }
        );
      }
    } else if (target instanceof joint.dia.Link && type !== 'tap' && type !== 'destination') {
      this.moveNodeOnLink(flo, source as dia.Element, target as dia.Link);
    } else if (flo.autolink && relinking) {
      this.performAutoLinking(flo, dragDescriptor.source.view);
    }
  }

  private performAutoLinking(flo: Flo.EditorContext, view: dia.CellView): void {
    // Search the graph for open ports - if only 1 is found, and it matches what
    // the dropped node needs, join it up!
    const group = view.model.prop('metadata/group');
    const graph = flo.getGraph();
    let wantOpenInputPort = false; // want something with an open input port
    let wantOpenOutputPort = false; // want something with an open output port
    if (group === ApplicationType[ApplicationType.source]) {
      wantOpenInputPort = true;
    } else if (group === ApplicationType[ApplicationType.sink]) {
      wantOpenOutputPort = true;
    } else if (group === ApplicationType[ApplicationType.processor]) {
      wantOpenInputPort = true;
      wantOpenOutputPort = true;
    }
    const openPorts = [];
    let linksIn;

    graph
      .getElements()
      .filter(e => e.id !== view.model.id && e.prop('metadata/name'))
      .forEach(element => {
        switch (element.prop('metadata/group')) {
          case ApplicationType[ApplicationType.source]:
            if (wantOpenOutputPort) {
              const primaryLink = graph
                .getConnectedLinks(element, {outbound: true})
                .find(l => !l.attr('props/isTapLink'));
              if (!primaryLink) {
                openPorts.push({node: element, openPort: 'output'});
              }
            }
            break;
          case ApplicationType[ApplicationType.sink]:
            if (wantOpenInputPort) {
              linksIn = graph.getConnectedLinks(element, {inbound: true});
              if (linksIn.length === 0) {
                openPorts.push({node: element, openPort: 'input'});
              }
            }
            break;
          case ApplicationType[ApplicationType.processor]:
            if (wantOpenOutputPort) {
              const primaryLink = graph
                .getConnectedLinks(element, {outbound: true})
                .find(l => !l.attr('props/isTapLink'));
              if (!primaryLink) {
                openPorts.push({node: element, openPort: 'output'});
              }
            }
            if (wantOpenInputPort) {
              linksIn = graph.getConnectedLinks(element, {inbound: true});
              if (linksIn.length === 0) {
                openPorts.push({node: element, openPort: 'input'});
              }
            }
            break;
          default:
        }
      });

    if (openPorts.length === 1) {
      // One candidate match!
      const match = openPorts.shift();
      let sourceView: dia.CellView;
      let targetView: dia.CellView;
      if (match.openPort === 'input') {
        sourceView = view;
        targetView = flo.getPaper().findViewByModel(match.node);
      } else {
        sourceView = flo.getPaper().findViewByModel(match.node);
        targetView = view;
      }
      flo.createLink(
        {
          id: sourceView.model.id,
          magnet: '.output-port',
          port: 'output'
        },
        {
          id: targetView.model.id,
          magnet: '.input-port',
          port: 'input'
        }
      );
    }
  }

  get allowLinkVertexEdit(): boolean {
    return false;
  }
}
