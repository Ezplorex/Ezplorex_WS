const CATEGORIES = [
  "Embedded Systems",
  "C / Embedded C",
  "RTOS",
  "Electronics",
  "PCB & Hardware",
  "Projects",
  "Edge AI & AI in Electronics",
  "Power Electronics"
];

const POSTS = [
  {
    slug: "what-is-volatile-in-c",
    title: "volatile in C: What It Does, When to Use It, and What It Does Not Solve",
    category: "C / Embedded C",
    date: "September 2, 2026",
    excerpt: "A practical guide to volatile in C, including interrupts, hardware registers, compiler optimization, atomicity, and the common mistakes embedded developers make.",
    content: `
      <div class="quick-answer">
        <strong>Quick answer:</strong> In C, <code>volatile</code> tells the compiler that accesses to an object have special observable behavior and must not be optimized like ordinary accesses. It is commonly relevant to hardware registers and values changed by interrupt or other external mechanisms. It does <strong>not</strong> make an operation atomic, make shared data automatically thread-safe, or replace synchronization.
      </div>

      <h2>Why does volatile exist?</h2>
      <p>In embedded C, you will often see <code>volatile</code> around variables associated with interrupts, peripherals, status registers, or other state that can change outside the ordinary sequence of instructions in the code being compiled.</p>
      <p>A common explanation is: <em>"volatile tells the compiler that the variable can change unexpectedly."</em> That is a useful starting point, but it hides the important detail: <strong>volatile is primarily about how the compiler must treat accesses to an object.</strong></p>

      <h2>A simple example</h2>
      <p>Consider a loop that waits for a value to change:</p>
      <pre><code>int flag = 0;

while (flag == 0)
{
    // Wait for something to happen
}</code></pre>
      <p>If nothing in the visible execution flow changes <code>flag</code>, the compiler can reason about the program and optimize ordinary accesses according to the C language rules.</p>
      <p>Now imagine that an interrupt service routine can change the value:</p>
      <pre><code>int flag = 0;

void ISR(void)
{
    flag = 1;
}

int main(void)
{
    while (flag == 0)
    {
        // Wait
    }

    // Continue
}</code></pre>
      <p>The programmer knows that an interrupt can affect the variable. The compiler needs that relationship expressed in the source program. This is one situation where <code>volatile</code> becomes relevant:</p>
      <pre><code>volatile int flag = 0;</code></pre>

      <h2>What volatile actually does</h2>
      <p>A volatile-qualified object has special access semantics. The compiler must preserve the required volatile accesses instead of treating them as ordinary accesses that can freely disappear, merge, or be reused when doing so would violate the observable behavior required by the language.</p>
      <p>In embedded systems, this matters particularly for:</p>
      <ul>
        <li>Memory-mapped peripheral registers</li>
        <li>Status values affected by hardware</li>
        <li>Variables updated by an interrupt service routine</li>
        <li>Other objects whose values can change through mechanisms outside the normal code flow</li>
      </ul>

      <h2>volatile with interrupts</h2>
      <p>A classic bare-metal pattern is an ISR setting a flag while the main loop processes it:</p>
      <pre><code>volatile int event = 0;

void Timer_ISR(void)
{
    event = 1;
}

int main(void)
{
    while (1)
    {
        if (event)
        {
            event = 0;

            // Handle the event
        }
    }
}</code></pre>
      <p>Here, <code>volatile</code> helps ensure that the compiler treats reads and writes to <code>event</code> as observable accesses. It does not, however, answer whether the communication protocol between the ISR and main loop is sufficient for the application.</p>

      <h2>volatile and hardware registers</h2>
      <p>Hardware registers are another classic use case. A peripheral can change a register without the CPU executing a normal C assignment to that object.</p>
      <pre><code>volatile unsigned int *STATUS =
    (volatile unsigned int *)0x40000000;</code></pre>
      <p>A read from a hardware register may therefore need to occur even when the compiler cannot see a conventional software reason for repeatedly reading it. Likewise, a write may be significant because it changes hardware state.</p>

      <h2>What volatile does NOT solve</h2>
      <p>This is the section worth remembering.</p>
      <ul>
        <li><strong>It does not make operations atomic.</strong></li>
        <li><strong>It does not automatically prevent race conditions.</strong></li>
        <li><strong>It does not make a multi-step read-modify-write operation indivisible.</strong></li>
        <li><strong>It does not replace mutexes, semaphores, critical sections, or atomic operations.</strong></li>
        <li><strong>It does not turn a flag into an event counter.</strong></li>
      </ul>

      <h2>Why volatile does not make counter++ safe</h2>
      <p>Consider:</p>
      <pre><code>volatile int counter;

counter++;</code></pre>
      <p>It is tempting to think that because the variable is volatile, the increment must be safe. But a read-modify-write operation can conceptually involve:</p>
      <pre><code>read counter
add 1
write counter</code></pre>
      <p>An interrupt or another execution context can interact with the variable between those steps. <code>volatile</code> does not provide a general atomicity guarantee for the entire increment.</p>

      <h2>volatile vs atomicity vs synchronization</h2>
      <table>
        <thead><tr><th>Concept</th><th>What problem it addresses</th></tr></thead>
        <tbody>
          <tr><td><code>volatile</code></td><td>How the compiler treats accesses to a volatile object</td></tr>
          <tr><td>Atomic operation</td><td>Whether an operation has indivisible atomic semantics</td></tr>
          <tr><td>Synchronization</td><td>How execution contexts safely coordinate shared state</td></tr>
          <tr><td>Critical section</td><td>How access to a protected region is temporarily controlled</td></tr>
        </tbody>
      </table>

      <h2>The single-flag problem</h2>
      <p>A volatile flag can tell the main program that <strong>at least one</strong> event occurred. It cannot necessarily tell the main program how many events occurred.</p>
      <pre><code>ISR #1  → event = 1
ISR #2  → event = 1
Main    → sees event = 1</code></pre>
      <p>If both interrupts happen before the main loop processes the flag, the fact that two events occurred may be lost. If every event matters, an event counter, queue, ring buffer, or another event-handling mechanism may be a better design.</p>
      <p>See also: <a href="article.html?post=single-interrupt-flag-miss-events">Why a single interrupt flag can make you miss events</a>.</p>

      <h2>When should I use volatile?</h2>
      <ol>
        <li>Identify whether the object can change outside the normal code flow.</li>
        <li>Check whether hardware or an ISR can modify it.</li>
        <li>Ask whether the access itself must remain observable to the compiler.</li>
        <li>Separately ask whether the operation also needs atomicity or synchronization.</li>
        <li>Choose the synchronization mechanism required by the actual execution model.</li>
      </ol>

      <h2>Common misconception</h2>
      <p><strong>"If data is shared, make it volatile."</strong> This is too broad. The correct question is not simply whether data is shared. The correct question is what can change the object, what guarantees the application requires, and which mechanism provides those guarantees.</p>

      <h2>Key takeaway</h2>
      <p><strong><code>volatile</code> is not a magic safety keyword.</strong> It addresses the compiler's treatment of accesses to an object with externally observable changes. Atomicity, synchronization, event preservation, and memory-ordering requirements are separate engineering problems.</p>
      <p>Understanding that distinction is one of the foundations of reliable embedded C programming.</p>
    `
  },
  {
    slug: "single-interrupt-flag-miss-events",
    title: "Why a Single Interrupt Flag Can Make You Miss Events",
    category: "Embedded Systems",
    date: "August 30, 2026",
    excerpt: "A simple flag is useful when you only care that something happened, but it cannot preserve multiple events that arrive before the main loop processes them.",
    content: `<p>A flag is one of the simplest ways to communicate an event from an interrupt service routine to the main program.</p><h2>Where the problem appears</h2><p>If an interrupt happens twice before the main loop checks the flag, both interrupts can produce the same final state.</p><pre><code>ISR #1  → eventFlag = 1
ISR #2  → eventFlag = 1
Main    → sees eventFlag = 1</code></pre><p>A flag tells us that at least one event happened, but not necessarily how many events happened.</p><h2>Better approaches</h2><p>If every occurrence matters, consider an event counter, queue, ring buffer, or another mechanism that preserves multiple occurrences.</p><h2>Key takeaway</h2><p>Use a flag when the requirement is "something happened." Use a counting or buffering mechanism when the requirement is "process every occurrence."</p>`
  },
  {
    slug: "component-orientation-pick-place",
    title: "When Component Orientation Creates Pick-and-Place Problems",
    category: "PCB & Hardware",
    date: "August 30, 2026",
    excerpt: "A practical observation: inconsistent component orientation or packaging can create problems for automated assembly even when the component's electrical specification is correct.",
    content: `<p>Component selection is not only about electrical specifications. Packaging, orientation, feeder setup, and supplier consistency can also affect automated assembly.</p><h2>Why this matters</h2><p>Pick-and-place equipment and vision systems work from expected physical presentation. When the actual presentation differs, recognition or rotation handling can fail.</p><h2>Key takeaway</h2><p>A component can be electrically correct and still create a manufacturing problem if its physical presentation is inconsistent with the assembly process.</p>`
  }
];
