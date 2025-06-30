import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges and deduplicates class names', () => {
    // Provided tailwind classes with duplicates and synonyms
    const result = cn('p-2', 'text-red-500', false && 'hidden', 'p-2');
    // Assert contains both classes without duplicates (order may vary)
    const classes = result.split(' ').sort();
    expect(classes).toEqual(['p-2', 'text-red-500'].sort());
  });
}); 