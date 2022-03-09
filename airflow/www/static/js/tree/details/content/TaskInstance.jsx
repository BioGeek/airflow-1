/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* global moment */

import React from 'react';
import {
  Text,
  Box,
  Button,
  Flex,
  Link,
} from '@chakra-ui/react';
import { finalStatesMap, getMetaValue } from '../../../utils';

import { formatDateTime, getDuration, formatDuration } from '../../../datetime_utils';

const isK8sExecutor = getMetaValue('k8s_or_k8scelery_executor') === 'True';

const TaskInstance = ({
  instance: {
    dagId,
    duration,
    operator,
    startDate,
    endDate,
    state,
    taskId,
    runId,
    mappedStates,
    executionDate,
  },
  task,
}) => {
  const isGroup = !!task.children;
  const groupSummary = [];
  const mapSummary = [];

  if (isGroup) {
    const numMap = finalStatesMap();
    task.children.forEach((child) => {
      const taskInstance = child.instances.find((ti) => ti.runId === runId);
      if (taskInstance) {
        const stateKey = taskInstance.state == null ? 'no_status' : taskInstance.state;
        if (numMap.has(stateKey)) numMap.set(stateKey, numMap.get(stateKey) + 1);
      }
    });
    numMap.forEach((key, val) => {
      if (key > 0) {
        groupSummary.push(
          // eslint-disable-next-line react/no-array-index-key
          <Text key={val} ml="10px">
            {val}
            {': '}
            {key}
          </Text>,
        );
      }
    });
  }

  if (task.isMapped && mappedStates) {
    const numMap = finalStatesMap();
    mappedStates.forEach((s) => {
      const stateKey = s || 'no_status';
      if (numMap.has(stateKey)) numMap.set(stateKey, numMap.get(stateKey) + 1);
    });
    numMap.forEach((key, val) => {
      if (key > 0) {
        mapSummary.push(
          // eslint-disable-next-line react/no-array-index-key
          <Text key={val} ml="10px">
            {val}
            {': '}
            {key}
          </Text>,
        );
      }
    });
  }

  const taskIdTitle = isGroup ? 'Task Group Id: ' : 'Task Id: ';

  const params = new URLSearchParams({
    dag_id: dagId,
    task_id: task.id,
    execution_date: executionDate,
  }).toString();
  const detailsLink = `/task?${params}`;
  const renderedLink = `/rendered-templates?${params}`;
  const logLink = `/log?${params}`;
  const k8sLink = `/rendered-k8s?${params}`;
  const listParams = new URLSearchParams({
    _flt_3_dag_id: dagId,
    _flt_3_task_id: taskId,
    _oc_TaskInstanceModelView: executionDate,
  });
  const allInstancesLink = `/taskinstance/list?${listParams}`;

  return (
    <Box fontSize="12px" py="4px">
      {!isGroup && !task.isMapped && (
        <Flex justifyContent="space-evenly">
          <Button as={Link} variant="outline" href={detailsLink}>Instance Details</Button>
          <Button as={Link} variant="outline" href={renderedLink}>Rendered Template</Button>
          {isK8sExecutor && (
            <Button as={Link} variant="outline" href={k8sLink}>K8s Pod Spec</Button>
          )}
          <Button as={Link} variant="outline" href={logLink}>Log</Button>
          <Button as={Link} variant="outline" href={allInstancesLink}>All Instances</Button>
        </Flex>
      )}
      {task.tooltip && (
        <Text>{task.tooltip}</Text>
      )}
      <Text>
        <Text as="strong">Status:</Text>
        {' '}
        {state || 'no status'}
      </Text>
      {isGroup && (
        <>
          <br />
          <Text as="strong">Group Summary</Text>
          {groupSummary}
        </>
      )}
      {task.isMapped && (
        <>
          <br />
          <Text as="strong">
            {mappedStates.length}
            {' '}
            {mappedStates.length === 1 ? 'Task ' : 'Tasks '}
            Mapped
          </Text>
          {mapSummary}
        </>
      )}
      <br />
      <Text>
        {taskIdTitle}
        {taskId}
      </Text>
      <Text whiteSpace="nowrap">
        Run Id:
        {' '}
        {runId}
      </Text>
      {operator && (
      <Text>
        Operator:
        {' '}
        {operator}
      </Text>
      )}
      <Text>
        Duration:
        {' '}
        {formatDuration(duration || getDuration(startDate, endDate))}
      </Text>
      <br />
      <Text as="strong">UTC</Text>
      <Text>
        Started:
        {' '}
        {startDate && formatDateTime(moment.utc(startDate))}
      </Text>
      <Text>
        Ended:
        {' '}
        {endDate && formatDateTime(moment.utc(endDate))}
      </Text>
      <br />
      <Text as="strong">
        Local:
        {' '}
        {moment().format('Z')}
      </Text>
      <Text>
        Started:
        {' '}
        {startDate && formatDateTime(startDate)}
      </Text>
      <Text>
        Ended:
        {' '}
        {endDate && formatDateTime(endDate)}
      </Text>
    </Box>
  );
};

export default TaskInstance;
