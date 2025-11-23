import { CallRecord } from '@/types/call';
import { SchemaDefinition, AnalyticsView } from '@/types/schema';

/**
 * Generic analytics result for any dimension/measure combination
 */
export interface GenericAnalyticResult {
  dimension: string; // The dimension value (e.g., "Agent 1", "Product A", "High Risk")
  measure: number; // The aggregated measure value
  count: number; // Number of records in this group
  percentage?: number; // Percentage of total
}

/**
 * Time-series data point for trend analysis
 */
export interface TrendDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number; // Aggregated value for this date
  count: number; // Number of records on this date
}

/**
 * Correlation result between two fields
 */
export interface CorrelationResult {
  field1: string;
  field2: string;
  coefficient: number; // Pearson correlation coefficient (-1 to 1)
  pValue?: number; // Statistical significance
  strength: 'strong' | 'moderate' | 'weak' | 'none'; // Interpretation
}

/**
 * Generic analytics engine that works with any schema
 * Replaces hardcoded aggregation functions with dynamic, schema-driven analytics
 */
export class GenericAnalyticsEngine {
  /**
   * Aggregate calls by a dimension field and calculate measure statistics
   */
  static aggregateByDimension(
    calls: CallRecord[],
    schema: SchemaDefinition,
    view: AnalyticsView
  ): GenericAnalyticResult[] {
    const dimensionField = schema.fields.find(f => f.id === view.dimensionField);
    const measureField = schema.fields.find(f => f.id === view.measureField);

    if (!dimensionField) {
      console.warn(`Dimension field ${view.dimensionField} not found in schema`);
      return [];
    }

    // Group calls by dimension value
    const groups = new Map<string, CallRecord[]>();

    calls.forEach(call => {
      if (!call.metadata) return;

      const dimensionValue = call.metadata[view.dimensionField];
      const key = String(dimensionValue ?? 'Unknown');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(call);
    });

    // Calculate aggregated measure for each group
    const results: GenericAnalyticResult[] = [];
    const totalCalls = calls.length;

    groups.forEach((groupCalls, dimensionValue) => {
      const count = groupCalls.length;
      let measure = 0;

      if (measureField) {
        // Aggregate based on specified aggregation function
        switch (view.aggregation) {
          case 'sum':
            measure = groupCalls.reduce((sum, call) => 
              sum + (Number(call.metadata[view.measureField!]) || 0), 0
            );
            break;

          case 'avg':
            const total = groupCalls.reduce((sum, call) => 
              sum + (Number(call.metadata[view.measureField!]) || 0), 0
            );
            measure = count > 0 ? total / count : 0;
            break;

          case 'min':
            measure = Math.min(...groupCalls.map(call => 
              Number(call.metadata[view.measureField!]) || Infinity
            ));
            break;

          case 'max':
            measure = Math.max(...groupCalls.map(call => 
              Number(call.metadata[view.measureField!]) || -Infinity
            ));
            break;

          case 'count':
          default:
            measure = count;
            break;
        }
      } else {
        // If no measure field, just count
        measure = count;
      }

      results.push({
        dimension: dimensionValue,
        measure,
        count,
        percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0
      });
    });

    // Sort by measure value descending
    return results.sort((a, b) => b.measure - a.measure);
  }

  /**
   * Calculate trends over time for a specific measure
   */
  static calculateTrends(
    calls: CallRecord[],
    schema: SchemaDefinition,
    view: AnalyticsView
  ): TrendDataPoint[] {
    // Find timestamp field
    const timestampField = schema.fields.find(f => f.semanticRole === 'timestamp') 
      || schema.fields.find(f => f.dataType === 'date');

    if (!timestampField) {
      console.warn('No timestamp field found for trend analysis');
      return [];
    }

    const measureField = schema.fields.find(f => f.id === view.measureField);

    // Group calls by date
    const dateGroups = new Map<string, CallRecord[]>();

    calls.forEach(call => {
      if (!call.metadata) return;

      const timestamp = call.metadata[timestampField.id] || call.createdAt;
      const date = new Date(timestamp).toISOString().split('T')[0];

      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(call);
    });

    // Calculate aggregated values per date
    const trendData: TrendDataPoint[] = [];

    dateGroups.forEach((dateCalls, date) => {
      const count = dateCalls.length;
      let value = 0;

      if (measureField) {
        switch (view.aggregation) {
          case 'sum':
            value = dateCalls.reduce((sum, call) => 
              sum + (Number(call.metadata[view.measureField!]) || 0), 0
            );
            break;

          case 'avg':
            const total = dateCalls.reduce((sum, call) => 
              sum + (Number(call.metadata[view.measureField!]) || 0), 0
            );
            value = count > 0 ? total / count : 0;
            break;

          case 'min':
            value = Math.min(...dateCalls.map(call => 
              Number(call.metadata[view.measureField!]) || Infinity
            ));
            break;

          case 'max':
            value = Math.max(...dateCalls.map(call => 
              Number(call.metadata[view.measureField!]) || -Infinity
            ));
            break;

          case 'count':
          default:
            value = count;
            break;
        }
      } else {
        value = count;
      }

      trendData.push({ date, value, count });
    });

    // Sort by date ascending
    return trendData.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate correlation between two numeric fields
   */
  static correlate(
    calls: CallRecord[],
    schema: SchemaDefinition,
    field1Id: string,
    field2Id: string
  ): CorrelationResult | null {
    const field1 = schema.fields.find(f => f.id === field1Id);
    const field2 = schema.fields.find(f => f.id === field2Id);

    if (!field1 || !field2) {
      console.warn(`Fields ${field1Id} or ${field2Id} not found in schema`);
      return null;
    }

    // Extract numeric values (filter out non-numeric and null values)
    const pairs: Array<[number, number]> = [];

    calls.forEach(call => {
      if (!call.metadata) return;

      const val1 = Number(call.metadata[field1Id]);
      const val2 = Number(call.metadata[field2Id]);

      if (!isNaN(val1) && !isNaN(val2) && isFinite(val1) && isFinite(val2)) {
        pairs.push([val1, val2]);
      }
    });

    if (pairs.length < 3) {
      // Need at least 3 data points for meaningful correlation
      return {
        field1: field1.displayName,
        field2: field2.displayName,
        coefficient: 0,
        strength: 'none'
      };
    }

    // Calculate Pearson correlation coefficient
    const n = pairs.length;
    const sum1 = pairs.reduce((sum, [x]) => sum + x, 0);
    const sum2 = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sum1Sq = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sum2Sq = pairs.reduce((sum, [, y]) => sum + y * y, 0);
    const sumProduct = pairs.reduce((sum, [x, y]) => sum + x * y, 0);

    const numerator = n * sumProduct - sum1 * sum2;
    const denominator = Math.sqrt(
      (n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2)
    );

    const coefficient = denominator !== 0 ? numerator / denominator : 0;

    // Interpret strength
    const absCoeff = Math.abs(coefficient);
    let strength: 'strong' | 'moderate' | 'weak' | 'none';

    if (absCoeff >= 0.7) strength = 'strong';
    else if (absCoeff >= 0.4) strength = 'moderate';
    else if (absCoeff >= 0.2) strength = 'weak';
    else strength = 'none';

    return {
      field1: field1.displayName,
      field2: field2.displayName,
      coefficient: Math.round(coefficient * 1000) / 1000, // Round to 3 decimals
      strength
    };
  }

  /**
   * Generate scatter plot data for two numeric fields
   */
  static generateScatterData(
    calls: CallRecord[],
    schema: SchemaDefinition,
    xFieldId: string,
    yFieldId: string
  ): Array<{ x: number; y: number; label?: string }> {
    const xField = schema.fields.find(f => f.id === xFieldId);
    const yField = schema.fields.find(f => f.id === yFieldId);

    if (!xField || !yField) {
      console.warn(`Fields ${xFieldId} or ${yFieldId} not found in schema`);
      return [];
    }

    // Find a field to use as label (prefer participant_1)
    const labelField = schema.fields.find(f => f.semanticRole === 'participant_1') 
      || schema.fields.find(f => f.semanticRole === 'identifier');

    const data: Array<{ x: number; y: number; label?: string }> = [];

    calls.forEach(call => {
      if (!call.metadata) return;

      const x = Number(call.metadata[xFieldId]);
      const y = Number(call.metadata[yFieldId]);

      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        data.push({
          x,
          y,
          label: labelField ? String(call.metadata[labelField.id]) : undefined
        });
      }
    });

    return data;
  }

  /**
   * Calculate percentile for a numeric field
   */
  static calculatePercentile(
    calls: CallRecord[],
    fieldId: string,
    percentile: number // 0-100
  ): number | null {
    const values = calls
      .map(call => Number(call.metadata[fieldId]))
      .filter(val => !isNaN(val) && isFinite(val))
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    const index = (percentile / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= values.length) return values[values.length - 1];
    if (lower < 0) return values[0];

    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Generate distribution histogram for a numeric field
   */
  static generateHistogram(
    calls: CallRecord[],
    fieldId: string,
    buckets: number = 10
  ): Array<{ range: string; count: number; percentage: number }> {
    const values = calls
      .map(call => Number(call.metadata[fieldId]))
      .filter(val => !isNaN(val) && isFinite(val));

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketSize = (max - min) / buckets;

    const histogram: Array<{ range: string; count: number; percentage: number }> = [];

    for (let i = 0; i < buckets; i++) {
      const rangeStart = min + i * bucketSize;
      const rangeEnd = i === buckets - 1 ? max : min + (i + 1) * bucketSize;
      
      const count = values.filter(val => 
        val >= rangeStart && (i === buckets - 1 ? val <= rangeEnd : val < rangeEnd)
      ).length;

      histogram.push({
        range: `${rangeStart.toFixed(1)}-${rangeEnd.toFixed(1)}`,
        count,
        percentage: (count / values.length) * 100
      });
    }

    return histogram;
  }

  /**
   * Get top N values for a dimension field
   */
  static getTopValues(
    calls: CallRecord[],
    fieldId: string,
    limit: number = 10
  ): Array<{ value: string; count: number; percentage: number }> {
    const valueCounts = new Map<string, number>();

    calls.forEach(call => {
      if (!call.metadata) return;
      const value = String(call.metadata[fieldId] ?? 'Unknown');
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });

    const total = calls.length;
    const results = Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return results;
  }

  /**
   * Filter calls by criteria (for drill-down analytics)
   */
  static filterCalls(
    calls: CallRecord[],
    filters: Array<{ fieldId: string; operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains'; value: any }>
  ): CallRecord[] {
    return calls.filter(call => {
      if (!call.metadata) return false;

      return filters.every(filter => {
        const fieldValue = call.metadata[filter.fieldId];

        switch (filter.operator) {
          case 'eq':
            return fieldValue === filter.value;
          case 'gt':
            return Number(fieldValue) > Number(filter.value);
          case 'lt':
            return Number(fieldValue) < Number(filter.value);
          case 'gte':
            return Number(fieldValue) >= Number(filter.value);
          case 'lte':
            return Number(fieldValue) <= Number(filter.value);
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  /**
   * Calculate summary statistics for a numeric field
   */
  static calculateStatistics(
    calls: CallRecord[],
    fieldId: string
  ): {
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  } | null {
    const values = calls
      .map(call => Number(call.metadata[fieldId]))
      .filter(val => !isNaN(val) && isFinite(val));

    if (values.length === 0) return null;

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    const sorted = [...values].sort((a, b) => a - b);
    const median = count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];

    const min = Math.min(...values);
    const max = Math.max(...values);

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      sum: Math.round(sum * 100) / 100,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100
    };
  }
}
