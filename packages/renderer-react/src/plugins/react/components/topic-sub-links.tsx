import { TopicDirection } from '@blink-mind/core';
import * as React from 'react';
import styled from 'styled-components';
import { BaseWidget } from '../../../components/common';
import { BaseProps } from '../../../components/common/base-props';
import { centerPointX, centerPointY, centerY, Point } from '../../../utils';

import { collapseRefKey, contentRefKey, linksSvgRefKey } from '../../../utils';
const TopicLinksSvg = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  pointer-events: none;
`;
import debug from 'debug';
const log = debug('node:topic-sub-links');

interface Props extends BaseProps {}

interface State {
  curves: any[];
}

export class TopicSubLinks extends BaseWidget<Props, State> {
  state = {
    curves: []
  };
  layout() {
    const props = this.props;
    const { model, getRef, topicKey, dir, controller } = props;
    const z = model.zoomFactor;
    const topic = model.getTopic(topicKey);
    const content = getRef(contentRefKey(topicKey));
    const svgRect: ClientRect = getRef(
      linksSvgRefKey(topicKey)
    ).getBoundingClientRect();
    const collapseRect: ClientRect = getRef(
      collapseRefKey(topicKey)
    ).getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    let p1: Point, p2: Point, p3: Point;

    if (dir === TopicDirection.RIGHT) {
      p1 = {
        x: 0,
        y: centerY(contentRect) - svgRect.top
      };
      p2 = {
        x: collapseRect.right - svgRect.left + 10,
        y: p1.y
      };
    } else if (dir === TopicDirection.LEFT) {
      p1 = {
        x: svgRect.right - svgRect.left,
        y: centerY(contentRect) - svgRect.top
      };
      p2 = {
        x: collapseRect.left - svgRect.left - 10,
        y: p1.y
      };
    }
    const curves = [];

    topic.subKeys.forEach(key => {
      let curve;
      const linkStyle = controller.run('getLinkStyle', {
        ...props,
        topicKey: key
      });

      const rect = getRef(contentRefKey(key)).getBoundingClientRect();

      if (dir === TopicDirection.RIGHT) {
        p3 = {
          x: rect.left - svgRect.left,
          y: centerY(rect) - svgRect.top
        };
      }
      if (dir === TopicDirection.LEFT) {
        p3 = {
          x: rect.right - svgRect.left,
          y: centerY(rect) - svgRect.top
        };
      }
      const { lineType } = linkStyle;

      if (lineType === 'curve') {
        curve = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} C ${p2.x} ${centerPointY(
          p2,
          p3
        )} ${centerPointX(p2, p3)} ${p3.y} ${p3.x} ${p3.y}`;
      } else if (lineType === 'round') {
        const vDir = p3.y > p1.y ? 1 : -1;
        const hDir = p3.x > p1.x ? 1 : -1;
        const radius = linkStyle.lineRadius;
        // if (p3.y === p1.y) { //这样判断不可靠
        if (topic.subKeys.size === 1 || Math.abs(p3.y - p1.y) <= 1) {
          curve = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y}`;
        } else {
          // 0 表示逆时针 1 表示顺时针
          curve = `M ${p1.x} ${p1.y} H ${p2.x} V ${p3.y -
            vDir * radius} A ${radius} ${radius} 0 0 ${
            vDir * hDir === 1 ? 0 : 1
          } ${p2.x + radius * hDir} ${p3.y} H ${p3.x}`;
        }
      } else if (lineType === 'line') {
        curve = `M ${p1.x} ${p1.y} H ${p2.x} L ${p3.x} ${p3.y}`;
      }

      curves.push(
        <path
          key={`link-${key}`}
          d={curve}
          strokeWidth={linkStyle.lineWidth*z}
          stroke={linkStyle.lineColor}
          fill="none"
        />
      );
    });
    this.setState({
      curves
    });
  }

  render() {
    const { topicKey, saveRef, model } = this.props;
    const style = {transform: `scale(${1/model.zoomFactor})`};
    return (
      <TopicLinksSvg ref={saveRef(linksSvgRefKey(topicKey))} style={style}>
        <g>{this.state.curves}</g>
      </TopicLinksSvg>
    );
  }
}
