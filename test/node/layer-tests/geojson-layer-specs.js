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
import GeojsonLayer, {defaultElevation, defaultLineWidth, defaultRadius} from 'layers/geojson-layer/geojson-layer';

import {
  updatedLayerSimplifiedShape,
  updatedLayerV2
} from 'test/fixtures/test-csv-data';
import {
  dataId,
  preparedGeoDataset,
  testCreateCases,
  testFormatLayerDataCases,
  testRenderLayerCases,
  prepareGeojsonDataset
} from 'test/helpers/layer-utils';
import {updatedGeoJsonLayer, geoJsonWithStyle} from 'test/fixtures/geojson';
import {createNewDataEntry} from 'utils/dataset-utils';
import {processGeojson} from 'processors/data-processor';

test('#GeojsonLayer -> constructor', t => {
  const TEST_CASES = {
    CREATE: [
      {
        props: {
          dataId: 'smoothie',
          isVisible: true,
          label: 'test geojson layer'
        },
        test: layer => {
          t.ok(
            layer.config.dataId === 'smoothie',
            'geojsonLayer dataId should be correct'
          );
          t.ok(layer.type === 'geojson', 'type should be geojson');
          t.ok(layer.isAggregated === false, 'geojsonLayer is not aggregated');
        }
      }
    ]
  };

  testCreateCases(t, GeojsonLayer, TEST_CASES.CREATE);
  t.end();
});

test.only('#GeojsonLayer -> formatLayerData', t => {
  const filteredIndex = [0, 2, 4];

  const TEST_CASES = [
    {
      name: 'Geojson wkt polygon.1',
      layer: {
        type: 'geojson',
        id: 'test_geojson_layer_1',
        config: {
          color: [1, 2, 3],
          dataId,
          label: 'some geometry file',
          columns: {
            geojson: 'simplified_shape_v2'
          }
        }
      },
      datasets: {
        [dataId]: {
          ...preparedGeoDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;
        const expectedLayerData = {
          data: [
            updatedLayerV2.dataToFeature[2],
            updatedLayerV2.dataToFeature[4]
          ]
        };
        const expectedDataKeys = [
          'data',
          'getElevation',
          'getFillColor',
          'getFilterValue',
          'getLineColor',
          'getLineWidth',
          'getRadius'
        ];
        const expectedLayerMeta = updatedLayerV2.meta;
        const expectedDataToFeature = updatedLayerV2.dataToFeature;

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 7 keys'
        );
        // data
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct geojson layerData'
        );
        t.deepEqual(
          layerData.data.map(layerData.getElevation),
          [defaultElevation, defaultElevation],
          'getElevation should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getFillColor),
          [[1, 2, 3], [1, 2, 3]],
          'getFillColor should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getFilterValue),
          [[Number.MIN_SAFE_INTEGER, 0, 0, 0], [10, 0, 0, 0]],
          'getFilterValue should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getLineColor),
          [[1, 2, 3], [1, 2, 3]],
          'getLineColor should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getLineWidth),
          [defaultLineWidth, defaultLineWidth],
          'getLineWidth should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getRadius),
          [defaultRadius, defaultRadius],
          'getRadius should return correct value'
        );

        // meta
        t.deepEqual(
          layer.meta,
          expectedLayerMeta,
          'should format correct geojson layer meta'
        );
        // dataToFeature
        t.deepEqual(
          layer.dataToFeature,
          expectedDataToFeature,
          'should format correct geojson dataToFeature'
        );
      }
    },
    {
      name: 'Geojson wkt polygon.2',
      layer: {
        type: 'geojson',
        id: 'test_geojson_layer_2',
        config: {
          dataId,
          label: 'some geometry file',
          columns: {
            geojson: 'simplified_shape'
          },
          visConfig: {
            stroked: true,
            enable3d: true,
            colorRange: {
              colors: ['#010101', '#020202', '#030303']
            },
            strokeColorRange: {
              colors: ['#040404', '#050505', '#060606']
            }
          },
          // color by c_zip_type(string)
          colorField: preparedGeoDataset.fields.find(f => f.name === 'c_zip_type'),
          strokeColorField: preparedGeoDataset.fields.find(f => f.name === 'c_zip_type'),

          // stroke by c_number(real)
          sizeField: preparedGeoDataset.fields.find(f => f.name === 'c_number'),
          // stroke by a_zip(int)
          heightField: preparedGeoDataset.fields.find(f => f.name === 'a_zip')
        }
      },
      datasets: {
        [dataId]: {
          ...preparedGeoDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;
        const expectedLayerData = {
          data: [
            updatedLayerSimplifiedShape.dataToFeature[0],
            updatedLayerSimplifiedShape.dataToFeature[2],
            updatedLayerSimplifiedShape.dataToFeature[4]
          ]
        };
        const expectedDataKeys = [
          'data',
          'getElevation',
          'getFillColor',
          'getFilterValue',
          'getLineColor',
          'getLineWidth',
          'getRadius'
        ];
        const expectedLayerMeta = updatedLayerSimplifiedShape.meta;
        const expectedDataToFeature = updatedLayerSimplifiedShape.dataToFeature;

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 7 keys'
        );
        // data
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct geojson layerData'
        );
        t.deepEqual(
          // by a_zip
          // [7014, 7023, 7416] -> [0, 500]
          layerData.data.map(layerData.getElevation),
          [0, 9/402*500, 500],
          'getElevation should return correct value'
        );
        t.deepEqual(
          // by c_zip_type
          // 'C_Medium_High' null  'A_Low_Rural',
          layerData.data.map(layerData.getFillColor),
          [[2, 2, 2], [0, 0, 0, 0], [1, 1, 1]],
          'getFillColor should return correct value'
        );

        t.deepEqual(
          // by m_rate
          // 7.5 null 10
          layerData.data.map(layerData.getFilterValue),
          [[7.5, 0, 0, 0], [Number.MIN_SAFE_INTEGER, 0, 0, 0], [10, 0, 0, 0]],
          'getFilterValue should return correct value'
        );
        t.deepEqual(
          // by c_zip_type
          // 'C_Medium_High' null  'A_Low_Rural',
          layerData.data.map(layerData.getLineColor),
          [[5, 5, 5], [0, 0, 0, 0], [4, 4, 4]],
          'getLineColor should return correct value'
        );
        t.deepEqual(
          // c_number
          // 29.1, 23.8, 13.8 -> [0, 10]
          layerData.data.map(layerData.getLineWidth),
          [9.935064935064936, 6.493506493506494, 0],
          'getLineWidth should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getRadius),
          [1, 1, 1],
          'getRadius should return correct value'
        );
        // meta
        t.deepEqual(
          layer.meta,
          expectedLayerMeta,
          'should format correct geojson layerData'
        );
        // dataToFeature
        t.deepEqual(
          layer.dataToFeature,
          expectedDataToFeature,
          'should format correct geojson layerData'
        );
      }
    },
    {
      name: 'Geojson wkt polygon.3',
      layer: {
        type: 'geojson',
        id: 'test_geojson_layer_3',
        config: {
          dataId,
          label: 'some geometry file',
          columns: {
            geojson: '_geojson'
          },
          color: [5, 5, 5]
        }
      },
      datasets: {
        [dataId]: {
          ...prepareGeojsonDataset,
          filteredIndex
        }
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            updatedGeoJsonLayer.dataToFeature[0],
            updatedGeoJsonLayer.dataToFeature[2],
            updatedGeoJsonLayer.dataToFeature[4]
          ]
        };
        const expectedDataKeys = [
          'data',
          'getElevation',
          'getFillColor',
          'getFilterValue',
          'getLineColor',
          'getLineWidth',
          'getRadius'
        ];
        const expectedLayerMeta = updatedGeoJsonLayer.meta;
        const expectedDataToFeature = updatedGeoJsonLayer.dataToFeature;

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 7 keys'
        );
        // // data
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct geojson layerData'
        );
        t.deepEqual(
          layerData.data.map(layerData.getElevation),
          [defaultElevation, defaultElevation, defaultElevation],
          'getElevation should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getFillColor),
          [[5, 5, 5], [5, 5, 5], [5, 5, 5]],
          'getFillColor should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getFilterValue),
          [[11, 0, 0, 0], [20, 0, 0, 0], [Number.MIN_SAFE_INTEGER, 0, 0, 0]],
          'getFilterValue should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getLineColor),
          [[5, 5, 5], [5, 5, 5], [5, 5, 5]],
          'getLineColor should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getLineWidth),
          [],
          'getLineWidth should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getRadius),
          [defaultLineWidth, defaultLineWidth, defaultLineWidth],
          'getRadius should return correct value'
        );

        // meta
        t.deepEqual(
          layer.meta,
          expectedLayerMeta,
          'should format correct geojson layer meta'
        );
        // dataToFeature
        t.deepEqual(
          layer.dataToFeature,
          expectedDataToFeature,
          'should format correct geojson layer dataToFeature'
        );
      }
    },
    {
      name: 'Geojson with style properties',
      layer: {
        type: 'geojson',
        id: 'test_geojson_layer_4',
        config: {
          dataId,
          label: 'some geometry file',
          columns: {
            geojson: '_geojson'
          },
          color: [5, 5, 5]
        }
      },
      datasets: createNewDataEntry({
        info: {id: dataId},
        data: processGeojson(geoJsonWithStyle)
      }),
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          data: [
            updatedGeoJsonLayer.dataToFeature[0],
            updatedGeoJsonLayer.dataToFeature[2],
            updatedGeoJsonLayer.dataToFeature[4]
          ]
        };
        const expectedDataKeys = [
          'data',
          'getElevation',
          'getFillColor',
          'getFilterValue',
          'getLineColor',
          'getLineWidth',
          'getRadius'
        ];
        const expectedLayerMeta = updatedGeoJsonLayer.meta;
        const expectedDataToFeature = updatedGeoJsonLayer.dataToFeature;

        t.deepEqual(
          Object.keys(layerData).sort(),
          expectedDataKeys,
          'layerData should have 7 keys'
        );
        // // data
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct geojson layerData'
        );
        t.deepEqual(
          layerData.data.map(layerData.getElevation),
          [defaultElevation, defaultElevation, defaultElevation],
          'getElevation should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getFillColor),
          [[5, 5, 5], [5, 5, 5], [5, 5, 5]],
          'getFillColor should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getFilterValue),
          [[11, 0, 0, 0], [20, 0, 0, 0], [Number.MIN_SAFE_INTEGER, 0, 0, 0]],
          'getFilterValue should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getLineColor),
          [[5, 5, 5], [5, 5, 5], [5, 5, 5]],
          'getLineColor should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getLineWidth),
          [],
          'getLineWidth should return correct value'
        );
        t.deepEqual(
          layerData.data.map(layerData.getRadius),
          [defaultLineWidth, defaultLineWidth, defaultLineWidth],
          'getRadius should return correct value'
        );

        // meta
        t.deepEqual(
          layer.meta,
          expectedLayerMeta,
          'should format correct geojson layer meta'
        );
        // dataToFeature
        t.deepEqual(
          layer.dataToFeature,
          expectedDataToFeature,
          'should format correct geojson layer dataToFeature'
        );
      }
    }
  ];

  testFormatLayerDataCases(t, GeojsonLayer, [TEST_CASES[3]]);
  t.end();
});

test('#GeojsonLayer -> renderLayer', t => {
  const filteredIndex = [0, 2, 4];
  const dataCount = 3;
  const TEST_CASES = [
    {
      name: 'Test render geojson.1',
      layer: {
        id: 'test_layer_1',
        type: 'geojson',
        config: {
          dataId,
          color: [1, 2, 3],
          label: 'gps point',
          columns: {
            geojson: '_geojson'
          },
          visConfig: {
            strokeColor: [4, 5, 6]
          }
        }
      },
      datasets: {
        [dataId]: {
          ...prepareGeojsonDataset,
          filteredIndex
        }
      },
      assert: deckLayers => {
        const ids = [
          'test_layer_1',
          'test_layer_1-polygons-fill',
          'test_layer_1-polygons-stroke'
        ];
        t.deepEqual(
          deckLayers.map(l => l.id),
          ids,
          'Should render 3 deck layers'
        );
        // polygon fill attributes;
        const {attributes} = deckLayers[1].state.attributeManager;

        const indices = attributes.indices.value.length;

        // test elevation
        t.deepEqual(
          attributes.elevations.value.slice(0, indices - 1),
          new Float32Array(indices - 1).fill(defaultElevation),
          'Should have correct elevation'
        );

        const expectedFillColors = new Float32Array((indices - 1) * 4);
        const expectedLineColors = new Float32Array((indices - 1) * 4);

        for (let i = 0; i < indices - 1; i++) {
          expectedFillColors[i * 4] = 1;
          expectedFillColors[i * 4 + 1] = 2;
          expectedFillColors[i * 4 + 2] = 3;
          expectedFillColors[i * 4 + 3] = 255;
          expectedLineColors[i * 4] = 4;
          expectedLineColors[i * 4 + 1] = 5;
          expectedLineColors[i * 4 + 2] = 6;
          expectedLineColors[i * 4 + 3] = 255;
        }
        // test fillColors
        t.deepEqual(
          attributes.fillColors.value.slice(0, dataCount * 4),
          expectedFillColors,
          'Should have correct fillColors'
        );
        // test instanceFilterValues
        const expectedFilterValues = new Float32Array([
          11, 0, 0, 0,
          11, 0, 0, 0,
          11, 0, 0, 0,
          11, 0, 0, 0,
          11, 0, 0, 0,
          11, 0, 0, 0,
          20, 0, 0, 0,
          20, 0, 0, 0,
          20, 0, 0, 0,
          20, 0, 0, 0,
          Number.MIN_SAFE_INTEGER, 0, 0, 0,
          Number.MIN_SAFE_INTEGER, 0, 0, 0,
          Number.MIN_SAFE_INTEGER, 0, 0, 0,
          Number.MIN_SAFE_INTEGER, 0, 0, 0
        ]);
        t.deepEqual(
          attributes.instanceFilterValues.value.slice(0, dataCount * 4),
          expectedFilterValues,
          'Should have correct instanceFilterValues'
        );
        // test lineColors
        t.deepEqual(
          attributes.lineColors.value.slice(0, dataCount * 4),
          expectedLineColors,
          'Should have correct lineColors'
        );
        // test positions
        t.deepEqual(
          attributes.positions.value.length,
          42,
          'Should have 42 positions'
        );
      }
    }
  ];

  testRenderLayerCases(t, GeojsonLayer, TEST_CASES);
  t.end();
});
