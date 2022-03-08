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

/* global localStorage */

import React, { useRef, useEffect, useState } from 'react';
import {
  Table,
  Tbody,
  Box,
  Switch,
  FormControl,
  FormLabel,
  Spinner,
  Text,
  Thead,
  Flex,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { MdArrowForward, MdArrowBack } from 'react-icons/md';

import useTreeData from './useTreeData';
import renderTaskRows from './renderTaskRows';
import DagRuns from './dagRuns';
import Details from './details';
import { callModal, callModalDag } from '../dag';

const sidePanelKey = 'showSidePanel';

const Tree = () => {
  const containerRef = useRef();
  const scrollRef = useRef();
  const { data: { groups = {}, dagRuns = [] }, isRefreshOn, onToggleRefresh } = useTreeData();
  const [selected, setSelected] = useState({}); // selected task instance or dag run
  const isPanelOpen = JSON.parse(localStorage.getItem(sidePanelKey));
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: isPanelOpen });

  const toggleSidePanel = () => {
    if (!isOpen) localStorage.setItem(sidePanelKey, true);
    else localStorage.setItem(sidePanelKey, false);
    onToggle();
  };

  const dagRunIds = dagRuns.map((dr) => dr.runId);

  useEffect(() => {
    // Set initial scroll to far right if it is scrollable
    const runsContainer = scrollRef.current;
    if (runsContainer && runsContainer.scrollWidth > runsContainer.clientWidth) {
      runsContainer.scrollBy(runsContainer.clientWidth, 250);
    }
  }, [isOpen]); // isOpen is to redo the scroll when the side panel opens/closes

  const { runId, taskId } = selected;

  // show task/run info in the side panel, or just call the regular action modal
  const onSelect = (newSelected) => {
    if (isOpen) {
      const isSame = newSelected.runId === runId && newSelected.taskId === taskId;
      setSelected(isSame ? {} : newSelected);
    } else if (!isOpen) {
      if (newSelected.dagRun) {
        const { dagRun } = newSelected;
        callModalDag({
          execution_date: dagRun.executionDate,
          dag_id: dagRun.dagId,
          run_id: dagRun.runId,
        });
      } else if (newSelected.instance) {
        const extraLinks = newSelected.task.extraLinks || [];
        const { instance } = newSelected;
        callModal(
          taskId,
          instance.executionDate,
          extraLinks,
          instance.tryNumber,
          instance.operator === 'SubDagOperator' || undefined,
          instance.runId,
        );
      }
    }
  };

  return (
    <Box pl="24px" position="relative" ref={containerRef}>
      <Text transform="rotate(-90deg)" position="absolute" left="-6px" top="130px">Runs</Text>
      <Text transform="rotate(-90deg)" position="absolute" left="-6px" top="190px">Tasks</Text>
      <Flex flexGrow={1} justifyContent="flex-end" alignItems="center">
        <FormControl display="flex" width="auto" mr={2}>
          {isRefreshOn && <Spinner color="blue.500" speed="1s" mr="4px" />}
          <FormLabel htmlFor="auto-refresh" mb={0} fontSize="12px" fontWeight="normal">
            Auto-refresh
          </FormLabel>
          <Switch id="auto-refresh" onChange={onToggleRefresh} isChecked={isRefreshOn} size="lg" />
        </FormControl>
        <IconButton onClick={toggleSidePanel}>
          {isOpen
            ? <MdArrowForward size="18px" aria-label="Collapse Details" title="Collapse Details" />
            : <MdArrowBack size="18px" title="Expand Details" aria-label="Expand Details" />}
        </IconButton>
      </Flex>
      <Flex flexDirection="row" justifyContent="space-between">
        <Box
          mr="12px"
          mt="24px"
          pb="12px"
          overflowX="auto"
          ref={scrollRef}
          maxWidth={isOpen && '300px'}
          minWidth={isOpen && '300px'}
        >
          <Table height={0}>
            <Thead>
              <DagRuns
                containerRef={containerRef}
                selected={selected}
                onSelect={onSelect}
              />
            </Thead>
            <Tbody>
              {renderTaskRows({
                task: groups, containerRef, onSelect, selected, dagRunIds,
              })}
            </Tbody>
          </Table>
        </Box>
        {isOpen && (
          <Details selected={selected} onSelect={onSelect} />
        )}
      </Flex>
    </Box>
  );
};

export default Tree;
