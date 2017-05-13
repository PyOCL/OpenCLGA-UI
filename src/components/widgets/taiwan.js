import React, { PureComponent, PropTypes } from 'react';
import { Well } from 'react-bootstrap';
import Datamap from 'datamaps';
import d3 from 'd3';
import _ from 'lodash';
import mapJSON from '../../map/county.json';

// const MAP_ID = 'TOWN_MOI_1051214';
const MAP_ID = 'COUNTY_MOI_1051214';
const OBJECT_ID_KEY = 'COUNTYID';

class Taiwan extends PureComponent {

  static propTypes = {
    className: PropTypes.string,
    result: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.drawMap = ::this.drawMap;
  }

  componentDidMount() {
    this.drawMap();
  }

  drawMap() {
    if (!this.container) {
      setTimeout(this.drawMap, 33);
      return;
    }
    window.mapJSON = mapJSON;
    mapJSON.objects[MAP_ID].geometries.forEach((d) => {
      d.id = d.properties[OBJECT_ID_KEY];
    });
    console.log('loading');
    const start = new Date().getTime();
    const scope = { rotation: [121, 23.67] };

    const map = new Datamap({
      element: this.container,
      geographyConfig: {
        dataJson: mapJSON,
        zoomOnClick: true,
        highlightFillColor: (geo) => {
          return geo['fillColor'] || '#EDDC4E';
        },
        highlightOnHover: false,
        popupOnHover: false
      },
      fills: {
        defaultFill: '#EDDC4E'
      },
      scope: MAP_ID,
      setProjection: (element, options) => {
            var projection, path;
            projection = d3.geo.mercator()
                .center(scope.rotation)
                .scale(9000)
                .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
            path = d3.geo.path()
                .projection( projection );

            this.projection = projection;
            return {path: path, projection: projection};
      },
      done: (datamap) => {
        datamap.svg.call(d3.behavior.zoom().on('zoom', () => {
          datamap.svg.selectAll('g').attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
        }));
        console.log('elapsed: ', (new Date().getTime() - start));
      }
    });

    this.map = map;
  }

  render() {
    return (
      <Well className={this.props.className}>
        <div className='map' ref={(ref) => {this.container = ref;}} />
      </Well>
    );
  }
}

export default Taiwan;
