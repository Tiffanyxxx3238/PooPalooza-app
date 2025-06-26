import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 72;
const CHART_HEIGHT = 180;
const PADDING = 20;

type DataPoint = {
  day: string;
  value: number;
};

type LineChartProps = {
  data: DataPoint[];
  title?: string;
  maxValue?: number;
  minValue?: number;
};

export default function LineChart({ 
  data, 
  title = "Weekly Trend", 
  maxValue = 10, 
  minValue = 0 
}: LineChartProps) {
  const chartWidth = CHART_WIDTH - (PADDING * 2);
  const chartHeight = CHART_HEIGHT - (PADDING * 2);
  
  // Calculate x and y positions
  const getX = (index: number) => PADDING + (index * (chartWidth / (data.length - 1)));
  const getY = (value: number) => PADDING + chartHeight - ((value - minValue) / (maxValue - minValue) * chartHeight);
  
  // Generate path for the line
  let path = '';
  data.forEach((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    if (index === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  });

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Horizontal grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PADDING + (i * (chartHeight / 4));
          return (
            <Line
              key={`h-line-${i}`}
              x1={PADDING}
              y1={y}
              x2={CHART_WIDTH - PADDING}
              y2={y}
              stroke={Colors.primary.chart.grid}
              strokeWidth={1}
            />
          );
        })}
        
        {/* Vertical grid lines */}
        {data.map((_, i) => {
          const x = getX(i);
          return (
            <Line
              key={`v-line-${i}`}
              x1={x}
              y1={PADDING}
              x2={x}
              y2={CHART_HEIGHT - PADDING}
              stroke={Colors.primary.chart.grid}
              strokeWidth={1}
            />
          );
        })}
        
        {/* Line */}
        <Path
          d={path}
          fill="none"
          stroke={Colors.primary.chart.grid}
          strokeWidth={2.5}
        />
        
        {/* Data points */}
        {data.map((point, i) => (
          <Circle
            key={`point-${i}`}
            cx={getX(i)}
            cy={getY(point.value)}
            r={4}
            fill={Colors.primary.chart.dot}
          />
        ))}
        
        {/* X-axis labels */}
        {data.map((point, i) => (
          <SvgText
            key={`label-${i}`}
            x={getX(i)}
            y={CHART_HEIGHT - 5}
            fontSize={10}
            fill={Colors.primary.chart.dot}
            textAnchor="middle"
          >
            {point.day}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.primary.text
  },
});