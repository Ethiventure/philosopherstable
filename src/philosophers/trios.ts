/**
 * Per-seat difficulty trios: Medium and Low renderings of each thinker's own
 * High quote, used as worked shape-examples in the persona. High exemplars
 * live in each `{slug}.style.ts` as `high_exemplar`; only trios that pass
 * the Medium fail rules (docs/language-levels.md) are wired here — the rest
 * stay eval gold until rewritten. Spinoza/Kant/Bogdanov trios arrived via
 * the second NotebookLM run; Lenin/Bookchin/Deleuze Medium lines are
 * owner-side rewrites to the fail standard.
 */
export interface SeatTrio {
  medium: string;
  low: string;
}

export const SEAT_TRIOS: Record<string, SeatTrio> = {
  spinoza: {
    medium: 'For instance, the physical human being named Peter is a real existing thing, whereas a completely accurate mental picture of Peter shows his true nature within thought — a picture that exists as a real thought in its own right, entirely separate from the physical person himself.',
    low: 'Take a real man named Peter. A correct thought about Peter is a picture of him in your mind. This thought is real on its own, but it is not the same thing as the living, breathing man.',
  },
  kant: {
    medium: 'All basic concepts of the mind deal broadly with how we join together different sensory experiences into single mental pictures, whereas the higher concepts of reason, which go beyond sensory experience to explore ultimate truths, deal with joining every possible cause and condition into one complete, unlimited whole.',
    low: 'Simple ideas in our mind help us join different sights and sounds together into one picture. But big ideas in our reason try to group all causes together into one complete whole that has no limits.',
  },
  hegel: {
    medium: 'In my perspective, which the full step-by-step unfolding of this philosophical framework must prove, every crucial point depends upon understanding and describing ultimate reality not merely as a passive underlying matter that exists on its own, but equally as an active living mind that thinks and transforms itself.',
    low: 'To find real truth, we must see the world correctly. Reality is not just a quiet thing standing in the background. It is also like a living mind that acts, thinks, and grows by itself.',
  },
  marx: {
    medium: 'My scientific way of breaking down real life starts not from an imaginary abstract human being but from the actual way a community produces goods during a specific historical era — an approach sharing no common ground with the academic habit of building theories by merely linking abstract words together.',
    low: 'My way of studying society does not start with an imaginary human being. It starts with the real ways people make goods at a specific time in history. This is completely different from professors who just link words together in their heads.',
  },
  lenin: {
    medium: 'We spent five years rushing to improve our state offices — the machinery of government — but the rushing itself achieved nothing: no better offices, and in places real harm.',
    low: 'We spent five years rushing around trying to fix our government offices. But all this busy work did not help at all. It was useless and caused real problems.',
  },
  bogdanov: {
    medium: 'On the contrary, degression — the use of rigid outer frames to lock parts in place — is a fixed arrangement of parts of great value, because only this protective shell makes the higher development of flexible, adaptable forms possible, by holding their movements safe and shielding delicate groupings from a harsh outside world.',
    low: 'Hard outer shells and rigid frameworks are very important. Without these stiff backbones, soft and flexible parts could not grow or adapt safely. The stiff shell locks working parts in place and protects delicate groups from a harsh world.',
  },
  bloch: {
    medium: 'The unrecognised future awareness rising in human longing, together with the unfulfilled physical possibilities in the world that have not yet taken shape, has not even entered ordinary language, let alone been understood as an organised philosophical idea, even though this still-hidden future gives purpose to human lives and forms the ultimate boundary of all existence.',
    low: 'People have deep hopes for a better future that is not here yet. This future gives meaning to human life and the whole world. But thinkers have failed to describe this future or turn it into a clear idea.',
  },
  weil: {
    medium: 'By claiming that moral perfection and the hard physical laws of nature share one ultimate spiritual unity beyond human experience, a thinker offers a mystery that human reason cannot grasp in answer to the deepest question of human existence.',
    low: 'Trying to join moral goodness and the harsh laws of nature into one high spiritual truth gives a confusing answer to the main question of human life.',
  },
  bookchin: {
    medium: 'Eduction, or drawing-out, is the gradual process by which the hidden qualities inside a thing grow toward their full form — in society, toward human freedom and the power to invent new things.',
    low: 'Real growth comes from drawing out good possibilities that are already inside us. By helping these hidden traits grow naturally, people can build a sensible society based on choice and creative ideas.',
  },
  deleuze: {
    medium: 'Differentiation — the way distinctness arises — describes a layer of reality existing before separate individual things take shape: it cannot be reduced to one general idea, but holds relations and unique points that define what Deleuze calls Ideas — real patterns existing as possibilities before they appear.',
    low: 'Deep reality exists before single things take shape. It cannot be simplified into one broad word. Instead, it holds hidden connections and special points that create potential patterns before they appear in the physical world.',
  },
  fisher: {
    medium: 'What we encounter in modern classrooms is not merely traditional student laziness, but the clash between young people shaped by digital screens who cannot focus for long and the strict, attention-demanding rules of old schooling institutions that are falling apart.',
    low: 'Young people today are not just lazy. The real problem is that teenagers raised on digital screens struggle to focus, while old school rules try to force them to sit quietly in ways that no longer work.',
  },
  rose: {
    medium: 'There is a split in our shared life, in what we do and in the groups we run, which every call for an ethics beyond nature only deepens by lifting it into make-believe.',
    low: 'People try to be good. The groups they live in still do harm. Calls to be purely good make this worse, not better. Stay with the trouble instead.',
  },
};

/** Shared fallback while a seat has no wired trio (currently none missing). */
export const FALLBACK_MEDIUM_EXAMPLE =
  'This contradiction leads to a new form through Aufhebung, a process in which the old form is overcome but also preserved within what comes next.';
