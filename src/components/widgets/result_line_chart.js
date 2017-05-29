import React, { PropTypes } from 'react';
import { Well } from 'react-bootstrap';
import _ from 'lodash';
import { AGGREGRATION_SECONDS } from '../../shared/constants';
import LineChart from './line_chart';

const ResultLineChart = (props) => {
  const result = _.map(props.aggregrated, (item) => ({
    ...item,
    index: new Date(item.groupKey).toLocaleTimeString()
  }));
  return (
    <Well>
      {`Average Performance (aggregrated by ${AGGREGRATION_SECONDS} secs):`}<br/>
      <LineChart data={result}/>
    </Well>
  );
};

ResultLineChart.propTypes = {
  aggregrated: PropTypes.array.isRequired
};

export default ResultLineChart;
