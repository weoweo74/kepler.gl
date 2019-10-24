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

import {GeoJsonLayer, GridLayer as DeckGLGridLayer} from 'deck.gl';
import AggregationLayer from '../aggregation-layer';
import EnhancedCPUGridLayer from 'deckgl-layers/grid-layer/enhanced-cpu-grid-layer';
import {pointToPolygonGeo} from './grid-utils';
import GridLayerIcon from './grid-layer-icon';
// import {HIGHLIGH_COLOR_3D} from 'constants/default-settings';

export const gridVisConfigs = {
  opacity: 'opacity',
  worldUnitSize: 'worldUnitSize',
  colorRange: 'colorRange',
  coverage: 'coverage',
  sizeRange: 'elevationRange',
  percentile: 'percentile',
  elevationPercentile: 'elevationPercentile',
  elevationScale: 'elevationScale',
  colorAggregation: 'aggregation',
  sizeAggregation: 'sizeAggregation',
  enable3d: 'enable3d'
};

export default class GridLayer extends AggregationLayer {
  constructor(props) {
    super(props);

    this.registerVisConfig(gridVisConfigs);
    this.visConfigSettings.worldUnitSize.label = 'Grid Size (km)';
  }

  get type() {
    return 'grid';
  }

  get layerIcon() {
    return GridLayerIcon;
  }

  calculateDataAttribute(allData, filteredIndex, getPosition) {
    const data = [];

    for (let i = 0; i < filteredIndex.length; i++) {
      const index = filteredIndex[i];
      const pos = getPosition({data: allData[index]});

      // if doesn't have point lat or lng, do not add the point
      // deck.gl can't handle position = null
      if (pos.every(Number.isFinite)) {
        data.push({
          index,
          data: allData[index]
        });
      }
    }

    return data;
  }

  renderLayer(opts) {
    const {
      data,
      gpuFilter,
      objectHovered,
      mapState,
      layerCallbacks
    } = opts;

    const zoomFactor = this.getZoomFactor(mapState);
    const eleZoomFactor = this.getElevationZoomFactor(mapState);
    const {visConfig} = this.config;
    const cellSize = visConfig.worldUnitSize * 1000;
    const updateTriggers = {
      getColorValue: {
        colorField: this.config.colorField,
        colorAggregation: this.config.visConfig.colorAggregation,
        ...gpuFilter.filterRange,
        ...gpuFilter.filterValueUpdateTriggers
      },
      getElevationValue: {
        sizeField: this.config.sizeField,
        sizeAggregation: this.config.visConfig.sizeAggregation,
        ...gpuFilter.filterRange,
        ...gpuFilter.filterValueUpdateTriggers
      }
    };

    return [
      new DeckGLGridLayer({
        ...this.getDefaultDeckLayerProps(opts),
        ...data,
        coverage: visConfig.coverage,

        // color
        colorRange: this.getColorRange(visConfig.colorRange),
        colorScale: this.config.colorScale,
        sizeScale: this.config.sizeScale,
        upperPercentile: visConfig.percentile[1],
        lowerPercentile: visConfig.percentile[0],

        // elevation
        extruded: visConfig.enable3d,
        elevationScale: visConfig.elevationScale * eleZoomFactor,
        elevationRange: visConfig.sizeRange,
        elevationLowerPercentile: visConfig.elevationPercentile[0],
        elevationUpperPercentile: visConfig.elevationPercentile[1],

        // callbacks
        onSetColorDomain: layerCallbacks.onSetLayerDomain,
        updateTriggers,
        _subLayerProps: {
          CPU: {
            type: EnhancedCPUGridLayer
          }
        }
      }),

      // render an outline of each cell if not extruded
      ...(this.isLayerHovered(objectHovered) && !visConfig.enable3d
        ? [
            new GeoJsonLayer({
              id: `${this.id}-hovered`,
              data: [
                pointToPolygonGeo({
                  object: objectHovered.object,
                  cellSize,
                  coverage: visConfig.coverage,
                  mapState
                })
              ],
              getLineColor: this.config.highlightColor,
              lineWidthScale: 8 * zoomFactor
            })
          ]
        : [])
    ];
  }
}
