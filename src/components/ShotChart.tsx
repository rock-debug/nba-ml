'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type Shot = {
    x: number;
    y: number;
    made: boolean;
    type: string;
};

export default function ShotChart({ shots }: { shots: Shot[] }) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = 500;
        const height = 470;
        const scale = width / 500;

        // Mapping Params
        // X: -250 to 250
        // Y: -50 to 420
        const xScale = d3.scaleLinear().domain([-250, 250]).range([0, width]);
        const yScale = d3.scaleLinear().domain([-50, 420]).range([height, 0]);

        // --- Helpers ---
        const line = d3.line<[number, number]>()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]));

        const courtColor = '#f3f4f6'; // Light gray background like reference
        const lineColor = '#374151'; // Dark gray/black lines
        const fillMade = '#065f46'; // Deep Green
        const strokeMiss = '#b91c1c'; // Red outline

        // --- Draw Court Markings ---

        // 1. Hoop & Backboard
        const cyHoop = yScale(0);
        const cxHoop = xScale(0);

        // Hoop
        svg.append('circle')
            .attr('cx', cxHoop)
            .attr('cy', cyHoop)
            .attr('r', 7.5 * scale)
            .attr('fill', 'none')
            .attr('stroke', '#d97706') // Orange hoop
            .attr('stroke-width', 2);

        // Backboard (Y = -12.5, Width 60)
        svg.append('line')  // Board
            .attr('x1', xScale(-30))
            .attr('y1', yScale(-12.5))
            .attr('x2', xScale(30))
            .attr('y2', yScale(-12.5))
            .attr('stroke', lineColor)
            .attr('stroke-width', 2);

        svg.append('line') // Stem
            .attr('x1', xScale(0))
            .attr('y1', yScale(-12.5))
            .attr('x2', xScale(0))
            .attr('y2', yScale(-20)) // Extends back
            .attr('stroke', lineColor)
            .attr('stroke-width', 2);

        // 2. The Paint (Key)
        // Outer Box: -80 to 80. Y: -47.5 (Base) to 137.5 (FT)
        // Note: Reference image has "Filled" lanes? Usually transparent or colored.
        // Let's keep transparent with lines.

        // Lane Lines
        svg.append('path')
            .datum([[-80, -47.5], [-80, 137.5], [80, 137.5], [80, -47.5]])
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', lineColor)
            .attr('stroke-width', 2);

        // Inner Key (Often not drawn in NBA simple charts, but let's add the circle)
        // Top of Key Circle (Center (0, 137.5), Radius 60)
        // Top half is solid, bottom half dashing?
        // Solid Top Arc
        const topKeyPath = d3.path();
        topKeyPath.arc(xScale(0), yScale(137.5), 60 * scale, -Math.PI, 0, false); // Screen coords!
        // Screen Y invert: 0 rad is 3 oclock. 
        // Top Half in Data = Up in Screen = Start PI to 2PI? 
        // Let's use points.
        // Right point (60, 137.5). Left point (-60, 137.5).
        // Arc is "Upper" on screen. 
        // Inverted Y: 
        // Right (60, 137.5) -> Angle 0? 
        // Up (0, 197.5) -> Angle -PI/2.
        // Left (-60, 137.5) -> Angle -PI.
        // So 0 to -PI counter-clockwise.

        // Wait, D3 arc angles increase clockwise.
        // 0 -> right. PI/2 -> Down. -PI/2 -> Up.
        // We want Right to Left via Top. 
        // 0 to -PI (counter-clockwise -> true).

        // Actually, let's just use d3.arc generator logic or trial.
        // Top half of circle on screen is Y = smaller.
        // Data Y=137.5 is center. 

        svg.append('path')
            .attr('d', d3.arc()
                .innerRadius(60 * scale)
                .outerRadius(60 * scale)
                .startAngle(-Math.PI / 2)
                .endAngle(Math.PI / 2) as any
            )
            .attr('transform', `translate(${xScale(0)}, ${yScale(137.5)})`)
            .attr('stroke', lineColor)
            .attr('fill', 'none')
            .attr('stroke-width', 2);

        // Bottom half (dashed)
        svg.append('path')
            .attr('d', d3.arc()
                .innerRadius(60 * scale)
                .outerRadius(60 * scale)
                .startAngle(Math.PI / 2)
                .endAngle(Math.PI * 1.5) as any
            )
            .attr('transform', `translate(${xScale(0)}, ${yScale(137.5)})`)
            .attr('stroke', lineColor)
            .attr('fill', 'none')
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-width', 2);

        // 3. 3-Point Line (Seamless)
        const yIntersect = Math.sqrt(237.5 ** 2 - 220 ** 2); // ~89.477

        // Screen coords for center and intersection
        const c3x = xScale(0);
        const c3y = yScale(0);
        const xLeft = xScale(-220);
        const yLeft = yScale(yIntersect);
        const xRight = xScale(220);
        const yRight = yScale(yIntersect);

        // Angles for arc
        const angleLeft = Math.atan2(yLeft - c3y, xLeft - c3x);
        const angleRight = Math.atan2(yRight - c3y, xRight - c3x);

        const p3 = d3.path();
        p3.moveTo(xScale(-220), yScale(-47.5)); // Start Left Baseline
        p3.lineTo(xLeft, yLeft); // To Left Corner
        p3.arc(c3x, c3y, 237.5 * scale, angleLeft, angleRight, false); // Arc to Right Corner
        p3.lineTo(xScale(220), yScale(-47.5)); // To Right Baseline

        svg.append('path')
            .attr('d', p3.toString())
            .attr('fill', 'none')
            .attr('stroke', lineColor)
            .attr('stroke-width', 2);

        // 4. Restricted Area (Radius 40)
        svg.append('path')
            .attr('d', d3.arc()
                .innerRadius(40 * scale)
                .outerRadius(40 * scale)
                .startAngle(-Math.PI / 2)
                .endAngle(Math.PI / 2) as any
            )
            .attr('transform', `translate(${xScale(0)}, ${yScale(0)})`) // at hoop
            .attr('stroke', lineColor)
            .attr('fill', 'none');


        // 5. Lane Hashes (Neutral Zone + others)
        // 7ft, 8ft, 11ft, 14ft from baseline.
        // Baseline Y = -47.5.
        // Y values: -40.5, -39.5, -36.5, -33.5.
        // Width: usually small tick mark.
        const hashY = [-40.5, -39.5, -36.5, -33.5];
        hashY.forEach(y => {
            // Left side (-80)
            svg.append('line')
                .attr('x1', xScale(-80))
                .attr('x2', xScale(-75)) // 5 units inward
                .attr('y1', yScale(y))
                .attr('y2', yScale(y))
                .attr('stroke', lineColor)
                .attr('stroke-width', 1);

            // Right side (80)
            svg.append('line')
                .attr('x1', xScale(80))
                .attr('x2', xScale(75))
                .attr('y1', yScale(y))
                .attr('y2', yScale(y))
                .attr('stroke', lineColor)
                .attr('stroke-width', 1);
        });

        // --- Draw Shots ---
        // Reference style: Made = Solid, Miss = Ring.

        svg.selectAll('circle.shot')
            .data(shots)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 4) // Slightly larger
            .attr('fill', d => d.made ? fillMade : 'none')
            .attr('stroke', d => d.made ? 'none' : strokeMiss)
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.8);

    }, [shots]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Shot Chart</h3>
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#065f46]"></div>
                        <span>Made</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full border-[1.5px] border-[#b91c1c]"></div>
                        <span>Missed</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-center bg-[#f3f4f6] rounded border border-gray-200 py-4">
                {/* Court container */}
                <svg ref={svgRef} width={500} height={470} />
            </div>
        </div>
    );
}
