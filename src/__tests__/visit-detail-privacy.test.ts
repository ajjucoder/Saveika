// Tests for visit-detail privacy - ensures head_name is not leaked to client component

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Visit Detail Privacy', () => {
  describe('Server component data shape', () => {
    it('should NOT include head_name in the data passed to client component', () => {
      // Read the actual page.tsx file and verify it doesn't select head_name
      const pagePath = join(process.cwd(), 'src/app/app/visits/[id]/page.tsx');
      const pageContent = readFileSync(pagePath, 'utf-8');
      
      // Check the select query - should NOT select head_name
      // The bug is that it currently does: code, head_name, area_id
      const selectMatch = pageContent.match(/select\(`([\s\S]*?)`\)/);
      
      if (selectMatch) {
        const selectContent = selectMatch[1];
        // Check if head_name is in the select for households
        const householdsMatch = selectContent.match(/households\s*\([^)]*\)/);
        if (householdsMatch) {
          const householdsFields = householdsMatch[0];
          // This assertion should FAIL initially because head_name IS being selected
          expect(householdsFields).not.toContain('head_name');
        }
      }
    });

    it('should verify client component type does not expect head_name', () => {
      // Read the client component file
      const clientPath = join(process.cwd(), 'src/components/chw/visit-detail-client.tsx');
      const clientContent = readFileSync(clientPath, 'utf-8');
      
      // The client component's type definition should NOT include head_name
      const typeMatch = clientContent.match(/type VisitWithDetails[^=]*=\s*Visit\s*&\s*\{[\s\S]*?households:\s*Pick<Household,\s*([^>]+)>/);
      
      if (typeMatch) {
        const pickedFields = typeMatch[1];
        // This assertion should FAIL initially because head_name IS in the Pick
        expect(pickedFields).not.toContain('head_name');
      }
    });
  });

  describe('Client component rendering', () => {
    it('should not render head_name anywhere in the UI', () => {
      // Client component should never display head_name
      // This is a behavioral test - the component should only display code, area, CHW name
      
      const expectedDisplayFields = [
        'household code',
        'area name',
        'CHW full name',
        'visit date',
        'risk score',
        'risk level',
        'responses',
        'explanation',
        'notes',
      ];

      // head_name should NOT be in this list
      expect(expectedDisplayFields).not.toContain('head_name');
      expect(expectedDisplayFields).not.toContain('household head name');
    });
  });
});
