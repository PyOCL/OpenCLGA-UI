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
    best: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    this.drawMap = ::this.drawMap;
  }

  componentDidMount() {
    this.drawMap();
  }

  prepareArcs() {
    return _.map(this.props.best, (item, index) => {
        const ret = {
          origin: {
            latitude: item.y,
            longitude: item.x
          }
        };

        const destItem = (index < this.props.best.length - 1) ? this.props.best[index + 1]
                                                              : this.props.best[0];

        ret.destination = {
          latitude: destItem.y,
          longitude: destItem.x
        };

        return ret;
    });
  }

  prepareTowns() {
    return _.map(this.props.best, (item) => {
      return {
        name: item.name,
        fillKey: 'town',
        latitude: item.y,
        longitude: item.x,
        radius: 1
      };
    });
  }

  drawMap() {
    if (!this.container) {
      setTimeout(this.drawMap, 33);
      return;
    }
    console.log('loading');
    window.mapJSON = mapJSON;
    mapJSON.objects[MAP_ID].geometries.forEach((d) => {
      d.id = d.properties[OBJECT_ID_KEY];
    });

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
      bubblesConfig: {
        borderWidth: 1,
        highlightBorderWidth: 1,
        exitDelay: 10
      },
      arcConfig: {
        stokeWidth: 1,
        arcSharpness: 0.01,
        animationSpeed: 0
      },
      fills: {
        town: '#1f77b4',
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

    map.arc(this.prepareArcs());
    map.bubbles(this.prepareTowns());

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
