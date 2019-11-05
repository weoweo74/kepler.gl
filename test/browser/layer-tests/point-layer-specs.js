// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape';
import moment from 'moment';
import {getDistanceScales} from 'viewport-mercator-project';
import {mount} from 'enzyme';
import {
  testCreateCases,
  testFormatLayerDataCases,
  testRenderLayerCases,
  preparedDataset,
  dataId,
  testRows,
  pointLayerMeta,
  fieldDomain
} from 'test/helpers/layer-utils';

import {KeplerGlLayers} from 'layers';
import {INITIAL_MAP_STATE} from 'reducers/map-state-updaters';
import {DEFAULT_TEXT_LABEL} from 'layers/layer-factory';

const {PointLayer} = KeplerGlLayers;

test('#PointLayer -> constructor', t => {
  const TEST_CASES = {
    CREATE: [
      {
        props: {
          dataId: 'smoothie',
          isVisible: true,
          label: 'test point layer'
        },
        test: layer => {
          t.ok(
            layer.config.dataId === 'smoothie',
            'PointLayer dataId should be correct'
          );
          t.ok(layer.type === 'point', 'type should be point');
          t.ok(layer.isAggregated === false, 'PointLayer is not aggregated');
          t.ok(
            layer.config.label === 'test point layer',
            'label should be correct'
          );

          t.deepEqual(
            layer.columnPairs,
            {
              lat: {pair: 'lng', fieldPairKey: 'lat'},
              lng: {pair: 'lat', fieldPairKey: 'lng'}
            },
            'columnPairs should be correct'
          );
          t.ok(typeof layer.layerIcon === 'function', 'should have layer icon');
        }
      }
    ]
  };

  testCreateCases(t, PointLayer, TEST_CASES.CREATE);
  t.end();
});

test('#PointLayer -> formatLayerData', t => {
  const filteredIndex = [0, 2, 4];

  const TEST_CASES = [
    {
      name: 'Point gps point.1',
      layer: {
        config: {
          dataId,
          label: 'gps point',
          columns: {
            lat: 'lat',
            lng: 'lng',
            altitude: 'id'
          },
          textLabel: [
            {
              field: {
                name: 'types',
                type: 'string'
              }
            },
            {
              field: {
                name: 'has_result',
                type: 'boolean'
              }
            }
          ],
          visConfig: {
            strokeColor: [1, 2, 3]
          }
        },
        type: 'point',
        id: 'test_layer_1'
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          textLabels: [
            {
              characterSet: [],
              getText: () => {}
            },
            {
              characterSet: [],
              getText: () => {}
            }
          ],
          data: [
            {
              data: testRows[0],
              index: 0,
              position: [testRows[0][2], testRows[0][1], testRows[0][7]]
            },
            {
              data: testRows[4],
              index: 4,
              position: [testRows[4][2], testRows[4][1], testRows[4][7]]
            }
          ],
          getFilterValue: () => {},
          getFillColor: () => {},
          getLineColor: () => {},
          getRadius: () => {},
          getPosition: () => {}
        };

        t.deepEqual(
          Object.keys(layerData).sort(),
          Object.keys(expectedLayerData).sort(),
          'layerData should have 7 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct point layerData data'
        );
        // getPosition
        t.deepEqual(
          layerData.getPosition(layerData.data[0]),
          [testRows[0][2], testRows[0][1], testRows[0][7]],
          'getPosition should return correct position'
        );
        // getFillColor
        t.deepEqual(
          layerData.getFillColor,
          layer.config.color,
          'getFillColor should be a constant'
        );
        // getLineColor
        t.deepEqual(
          layerData.getLineColor,
          [1, 2, 3],
          'getLineColor should be a constant'
        );
        // getRadius
        t.equal(layerData.getRadius, 1, 'getRadius should be a constant');
        // getFilterValue
        t.deepEqual(
          layerData.data.map(layerData.getFilterValue),
          [
            [Number.MIN_SAFE_INTEGER, 0, 0, 0],
            [moment.utc(testRows[4][0]).valueOf(), 0, 0, 0]
          ],
          'getFilterValue should return [0, 0, 0, 0]'
        );
        // textLabels
        t.deepEqual(
          layerData.textLabels.length,
          expectedLayerData.textLabels.length,
          'textLabels should have 2 items'
        );
        t.deepEqual(
          layerData.textLabels[0].characterSet,
          [
            'd',
            'r',
            'i',
            'v',
            'e',
            '_',
            'a',
            'n',
            'l',
            'y',
            't',
            'c',
            's',
            '0'
          ],
          'textLabels should have correct characterSet'
        );
        t.deepEqual(
          layerData.textLabels[0].getText(layerData.data[0]),
          'driver_analytics_0',
          'textLabels getText should have correct text'
        );
        // layerMeta
        t.deepEqual(
          layer.meta,
          pointLayerMeta,
          'should format correct point layer meta'
        );
      }
    },
    {
      name: 'Test gps point.2 Data colorFields. sizeField and fixedRadius',
      layer: {
        type: 'point',
        id: 'test_layer_2',
        config: {
          dataId,
          label: 'some point file',
          columns: {
            lat: 'lat',
            lng: 'lng'
          },
          visConfig: {
            outline: true,
            fixedRadius: true,
            colorRange: {
              colors: ['#010101', '#020202', '#030303']
            },
            strokeColor: [4, 5, 6]
          },
          // color by id(integer)
          colorField: {
            type: 'integer',
            name: 'id'
          },
          // size by id(integer)
          sizeField: {
            type: 'integer',
            name: 'id'
          }
        }
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;
        const expectedLayerData = {
          data: [
            {
              data: testRows[0],
              index: 0,
              position: [testRows[0][2], testRows[0][1], 0]
            },
            {
              data: testRows[4],
              index: 4,
              position: [testRows[4][2], testRows[4][1], 0]
            }
          ],
          getFilterValue: () => {},
          getLineColor: () => {},
          getFillColor: () => {},
          getRadius: () => {},
          getPosition: () => {},
          textLabels: []
        };
        t.deepEqual(
          Object.keys(layerData).sort,
          Object.keys(expectedLayerData).sort,
          'layerData should have 7 keys'
        );
        t.deepEqual(
          layer.config.colorDomain,
          fieldDomain.id,
          'should update layer color domain'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should filter out nulls, format correct point layerData'
        );
        // getPosition
        t.deepEqual(
          layerData.getPosition(layerData.data[0]),
          [testRows[0][2], testRows[0][1], 0],
          'getPosition should return correct lat lng'
        );
        // layerMeta
        t.deepEqual(
          layer.meta,
          pointLayerMeta,
          'should format correct layerMeta'
        );
        // getFillColor
        t.deepEqual(
          layerData.getFillColor(layerData.data[0]),
          [1, 1, 1],
          'getFillColor should return correct color'
        );
        // getLineColor
        t.deepEqual(
          layerData.getLineColor,
          [4, 5, 6],
          'getLineColor should return correct color'
        );
        // getRadius
        // domain [1, 12124]
        t.equal(
          layerData.getRadius(layerData.data[0]),
          1,
          'getRadius should return fixed radius'
        );
      }
    },
    {
      name: 'Test gps point.2 Data strokeColorFields and SizeField',
      layer: {
        type: 'point',
        id: 'test_layer_2',
        config: {
          dataId,
          label: 'some point file',
          columns: {
            lat: 'lat',
            lng: 'lng'
          },
          color: [10, 10, 10],
          visConfig: {
            outline: true,
            colorRange: {
              colors: ['#010101', '#020202', '#030303']
            },
            strokeColorRange: {
              colors: ['#040404', '#050505', '#060606']
            },
            strokeColor: [4, 5, 6],
            radiusRange: [10, 100]
          },
          // color by id(integer)
          strokeColorField: {
            type: 'integer',
            name: 'id'
          },
          // size by id(integer)
          sizeField: {
            type: 'integer',
            name: 'id'
          }
        }
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            {
              data: testRows[0],
              index: 0,
              position: [testRows[0][2], testRows[0][1], 0]
            },
            {
              data: testRows[4],
              index: 4,
              position: [testRows[4][2], testRows[4][1], 0]
            }
          ],
          getFilterValue: () => {},
          getLineColor: () => {},
          getFillColor: () => {},
          getRadius: () => {},
          getPosition: () => {},
          textLabels: []
        };

        t.deepEqual(
          Object.keys(layerData).sort(),
          Object.keys(expectedLayerData).sort(),
          'layerData should have 6 keys'
        );
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct point layerData data'
        );
        t.deepEqual(
          layer.config.sizeDomain,
          [fieldDomain.id[0], fieldDomain.id[fieldDomain.id.length - 1]],
          'should update layer sizeDomain'
        );
        // getFillColor
        t.deepEqual(
          layerData.getFillColor,
          [10, 10, 10],
          'getFillColor should return correct color'
        );
        // getLineColor
        t.deepEqual(
          layerData.getLineColor(layerData.data[0]),
          [4, 4, 4],
          'getLineColor should return correct color'
        );
        // getRadius
        // domain [1, 12124]
        // range [10, 100]
        t.equal(
          layerData.getRadius(layerData.data[0]),
          10,
          'getRadius should return corrent radius'
        );
      }
    }
  ];

  testFormatLayerDataCases(t, PointLayer, TEST_CASES);
  t.end();
});

test('#PointLayer -> renderLayer', t => {
  const filteredIndex = [0, 2, 4];
  const dataCount = 2;
  const TEST_CASES = [
    {
      name: 'Test render point.1',
      layer: {
        id: 'test_layer_1',
        type: 'point',
        config: {
          dataId,
          label: 'gps point',
          columns: {
            lat: 'lat',
            lng: 'lng',
            altitude: null
          },
          strokeColorField: {
            type: 'string',
            name: 'types'
          },
          color: [1, 2, 3],
          visConfig: {
            strokeColorRange: {
              colors: ['#040404', '#050505', '#060606']
            },
            thickness: 3
          }
        }
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },

      assert: (deckLayers, layer) => {
        // test instanceAttributes

        t.equal(deckLayers.length, 1, 'Should create 1 deck.gl layer');
        const {attributes} = deckLayers[0].state.attributeManager;

        t.deepEqual(
          Object.keys(attributes).sort(),
          [
            'brushingTargets',
            'filterValues',
            'instanceFillColors',
            'instanceLineColors',
            'instanceLineWidths',
            'instancePickingColors',
            'instancePositions',
            'instanceRadius'
          ],
          'Should create 8 instance attributes'
        );

        // test instancePositions
        t.deepEqual(
          attributes.instancePositions.value.slice(0, dataCount * 3),
          new Float32Array([
            testRows[0][2],
            testRows[0][1],
            0,
            testRows[4][2],
            testRows[4][1],
            0
          ]),
          'Should calculate correct instancePosition'
        );
        // test instanceFillColors
        t.deepEqual(
          attributes.instanceFillColors.value,
          new Float32Array([1 / 255, 2 / 255, 3 / 255, 1]),
          'Should calculate correct instanceFillColor'
        );
        // test instanceFilterValues
        t.deepEqual(
          attributes.filterValues.value.slice(0, dataCount * 4),
          new Float32Array([
            Number.MIN_SAFE_INTEGER,
            0,
            0,
            0,
            moment.utc(testRows[4][0]).valueOf(),
            0,
            0,
            0
          ]),
          'Should calculate correct instanceFilterValues'
        );
        // test instanceLineColors
        // range:[[4, 4, 4], [5,5,5], [4, 4, 4]]
        // domain: ['driver_analytics', 'driver_analytics_0', 'driver_gps']
        t.deepEqual(
          attributes.instanceLineColors.value.slice(0, dataCount * 4),
          new Float32Array([5, 5, 5, 255, 4, 4, 4, 255]),
          'Should calculate correct instanceLineColors'
        );
        // test instanceLineWidths
        t.deepEqual(
          attributes.instanceLineWidths.value,
          [1],
          'Should calculate correct instanceLineWidths'
        );
        // test instanceRadius
        t.deepEqual(
          attributes.instanceRadius.value,
          [1],
          'Should calculate correct instanceRadius'
        );
      }
    },
    {
      name: 'Point gps point.1 with text labels',
      layer: {
        config: {
          dataId,
          label: 'gps point',
          columns: {
            lat: 'lat',
            lng: 'lng',
            altitude: 'id'
          },
          textLabel: [
            {
              field: {
                name: 'types',
                type: 'string'
              }
              // default anchor: start, alignment: center
            },
            {
              field: {
                name: 'has_result',
                type: 'boolean'
              },
              anchor: 'middle',
              alignment: 'bottom'
            }
          ],
          visConfig: {
            strokeColor: [1, 2, 3]
          }
        },
        type: 'point',
        id: 'test_layer_1'
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },
      assert: (deckLayers, layer, layerData) => {
        t.equal(deckLayers.length, 5, 'Should create 5 deck.gl layer');
        t.deepEqual(
          deckLayers.map(l => l.id),
          [
            'test_layer_1',
            'test_layer_1-label-types',
            'test_layer_1-label-types-characters',
            'test_layer_1-label-has_result',
            'test_layer_1-label-has_result-characters'
          ],
          'Should create 5 deck.gl layers'
        );
        // test test_layer_1-label-types
        const {
          getPosition,
          getColor,
          getSize,
          getPixelOffset,
          getFilterValue
        } = deckLayers[2].props;
        const {getPixelOffset: getPixelOffset1} = deckLayers[4].props;

        const distanceScale = getDistanceScales(INITIAL_MAP_STATE);
        const radiusScale = layer.getRadiusScaleByZoom(INITIAL_MAP_STATE);
        const pixelRadius = radiusScale * distanceScale.pixelsPerMeter[0];

        const padding = 20;

        // anchor: start, alignment: center
        const expectedPixelOffset0 = [
          1 * (pixelRadius + padding),
          0 * (pixelRadius + padding + 0)
        ];

        // anchor: 'middle', alignment: 'bottom'
        const expectedPixelOffset1 = [
          0 * (pixelRadius + padding),
          1 * (pixelRadius + padding + DEFAULT_TEXT_LABEL.size)
        ];

        t.deepEqual(
          getPosition(layerData.data[0]),
          [testRows[0][2], testRows[0][1], 1],
          'Should calculate correct getPosition'
        );
        t.deepEqual(
          getColor,
          DEFAULT_TEXT_LABEL.color,
          'Should calculate correct getColor'
        );
        t.deepEqual(getSize, 1, 'Should calculate correct getSize');
        t.deepEqual(
          getPixelOffset,
          expectedPixelOffset0,
          'Should calculate correct instancePixelOffset'
        );
        t.deepEqual(
          getPixelOffset1,
          expectedPixelOffset1,
          'Should calculate correct instancePixelOffset'
        );
        t.deepEqual(
          getFilterValue(layerData.data[0]),
          [Number.MIN_SAFE_INTEGER, 0, 0, 0],
          'Should calculate correct instancePixelOffset'
        );
      }
    },
    {
      name: 'Point gps point.1 with text labels, color and sizeField',
      layer: {
        config: {
          dataId,
          label: 'gps point',
          columns: {
            lat: 'lat',
            lng: 'lng',
            altitude: 'id'
          },
          textLabel: [
            {
              field: {
                name: 'types',
                type: 'string'
              },
              color: [2, 2, 2],
              size: 10,
              anchor: 'start',
              alignment: 'bottom'
            }
          ],
          // size by id(integer)
          sizeField: {
            type: 'integer',
            name: 'id'
          },
          visConfig: {
            strokeColor: [1, 2, 3]
          }
        },
        type: 'point',
        id: 'test_layer_1'
      },
      datasets: {
        [dataId]: {
          ...preparedDataset,
          filteredIndex
        }
      },
      assert: (deckLayers, layer, layerData) => {
        t.deepEqual(
          deckLayers.map(l => l.id),
          [
            'test_layer_1',
            'test_layer_1-label-types',
            'test_layer_1-label-types-characters'
          ],
          'Should create 3 deck.gl layers'
        );
        // test test_layer_1-label-types
        const {getColor, getSize, getPixelOffset} = deckLayers[2].props;

        const distanceScale = getDistanceScales(INITIAL_MAP_STATE);
        const radiusScale = layer.getRadiusScaleByZoom(INITIAL_MAP_STATE);
        const pixelRadius = radiusScale * distanceScale.pixelsPerMeter[0];

        const padding = 20;

        // anchor: start, alignment: center
        const getRadius = layerData.getRadius(layerData.data[1]);

        const expectedPixelOffset1 = [
          1 * (getRadius * pixelRadius + padding),
          1 * (getRadius * pixelRadius + padding + 10)
        ];
        t.deepEqual(getColor, [2, 2, 2], 'Should calculate correct getColor');
        t.deepEqual(getSize, 1, 'Should calculate correct getSize');
        t.deepEqual(
          getPixelOffset(layerData.data[1]),
          expectedPixelOffset1,
          'Should calculate correct instancePixelOffset multiplied by getRadius'
        );
      }
    }
  ];

  testRenderLayerCases(t, PointLayer, TEST_CASES);
  t.end();
});
