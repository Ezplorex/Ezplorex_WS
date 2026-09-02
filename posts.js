const POSTS = [
  {
    slug: "what-volatile-solves",
    title: "What volatile Actually Solves — and What It Does Not",
    category: "C Programming",
    date: "September 2, 2026",
    excerpt:
      "volatile helps the compiler treat a value as capable of changing unexpectedly. It does not make shared data atomic or automatically solve concurrency problems.",
    content: `
      <h2>Why does volatile exist?</h2>

      <p>
        In embedded C, you will often see variables declared with the
        <code>volatile</code> keyword, especially when dealing with interrupts,
        hardware registers, or memory that can change outside the normal flow
        of a program.
      </p>

      <p>
        A common explanation is:
        <strong>"volatile tells the compiler that the variable can change unexpectedly."</strong>
        That explanation is useful, but incomplete.
      </p>

      <p>
        The more important question is:
        <strong>What problem does volatile actually solve?</strong>
      </p>

      <p>
        The short answer is that <strong>volatile addresses how the compiler
        treats accesses to an object whose value may change for reasons
        outside the ordinary flow of the code being compiled.</strong>
        It does not, by itself, solve atomicity, synchronization, or
        concurrency problems.
      </p>

      <h2>A simple example</h2>

      <p>Consider this code:</p>

      <pre><code>int flag = 0;

while (flag == 0)
{
    // Wait for something to happen
}</code></pre>

      <p>
        From our perspective, the loop continuously checks
        <code>flag</code>.
        But the compiler is allowed to optimize ordinary code based on what
        it can determine about the program.
      </p>

      <p>
        Now imagine that an interrupt service routine changes the variable:
      </p>

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

    // Continue after the interrupt
}</code></pre>

      <p>
        The programmer knows that an interrupt can modify
        <code>flag</code>. The compiler does not automatically treat every
        ordinary variable as something that can be changed asynchronously.
      </p>

      <p>
        This is where <code>volatile</code> becomes important:
      </p>

      <pre><code>volatile int flag = 0;</code></pre>

      <p>
        The qualifier tells the compiler that accesses to this object have
        special observable behavior and must not be treated like ordinary
        accesses that can freely be optimized away.
      </p>

      <h2>What volatile actually tells the compiler</h2>

      <p>
        When an object is declared <code>volatile</code>, the compiler must
        preserve the required volatile accesses when generating the program.
        It cannot simply assume that repeatedly reading the object will always
        produce the same value.
      </p>

      <p>
        This is particularly important when a value can be affected by
        something outside the normal execution flow, such as:
      </p>

      <ul>
        <li>An interrupt service routine</li>
        <li>A memory-mapped hardware register</li>
        <li>A hardware peripheral</li>
        <li>Another mechanism that can change the object independently of the
            code currently being executed</li>
      </ul>

      <h2>Example: waiting for an interrupt</h2>

      <p>
        A common embedded pattern is to use a flag that is set inside an ISR:
      </p>

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

      <p>
        Here, <code>volatile</code> communicates to the compiler that
        <code>event</code> can change independently of the normal flow of
        instructions being compiled.
      </p>

      <h2>But volatile does NOT make an operation atomic</h2>

      <p>
        This is one of the most important distinctions to understand.
      </p>

      <p>
        Consider:
      </p>

      <pre><code>volatile int counter;

counter++;</code></pre>

      <p>
        It is tempting to think that <code>volatile</code> makes this operation
        safe because the compiler is forced to access the variable.
        It does not.
      </p>

      <p>
        A read-modify-write operation can conceptually involve:
      </p>

      <pre><code>read counter
add 1
write counter</code></pre>

      <p>
        An interrupt could occur between those operations. Therefore,
        <code>volatile</code> does not provide a general guarantee that
        <code>counter++</code> is indivisible.
      </p>

      <h2>volatile does NOT provide synchronization</h2>

      <p>
        Another common mistake is to use <code>volatile</code> as a replacement
        for proper synchronization mechanisms.
      </p>

      <p>
        If multiple execution contexts need to safely coordinate access to
        shared data, simply declaring the data volatile does not automatically
        make that communication safe.
      </p>

      <p>
        Depending on the system, synchronization may require mechanisms such as:
      </p>

      <ul>
        <li>Atomic operations</li>
        <li>Critical sections</li>
        <li>Interrupt masking</li>
        <li>Mutexes</li>
        <li>Semaphores</li>
        <li>Memory-ordering mechanisms appropriate to the platform</li>
      </ul>

      <h2>volatile and hardware registers</h2>

      <p>
        One of the classic uses of <code>volatile</code> is a memory-mapped
        hardware register.
      </p>

      <pre><code>volatile unsigned int *STATUS =
    (volatile unsigned int *)0x40000000;</code></pre>

      <p>
        Hardware can change the value of a peripheral register without the CPU
        executing an ordinary C assignment to that variable.
      </p>

      <p>
        Similarly, a write to a hardware register may be important even when
        the compiler cannot see an obvious software-level use for the value.
      </p>

      <p>
        The <code>volatile</code> qualifier helps preserve the required
        accesses to such objects.
      </p>

      <h2>volatile vs atomicity vs synchronization</h2>

      <table>
        <thead>
          <tr>
            <th>Concept</th>
            <th>Main purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>volatile</td>
            <td>Controls how the compiler treats accesses to volatile objects</td>
          </tr>
          <tr>
            <td>Atomic operation</td>
            <td>Provides indivisible operation semantics where supported</td>
          </tr>
          <tr>
            <td>Synchronization</td>
            <td>Coordinates access and ordering between execution contexts</td>
          </tr>
          <tr>
            <td>Critical section</td>
            <td>Temporarily prevents conflicting execution in a protected region</td>
          </tr>
        </tbody>
      </table>

      <p>
        A useful mental model is:
      </p>

      <pre><code>volatile
    ↓
"Compiler, this object can have externally observable changes."

atomic
    ↓
"This operation has indivisible semantics."

synchronization
    ↓
"These execution contexts must coordinate safely."</code></pre>

      <h2>A flag is not always enough</h2>

      <p>
        There is another limitation worth understanding.
        A flag can tell the main program that
        <strong>something happened</strong>, but it may not tell it
        <strong>how many times it happened</strong>.
      </p>

      <p>
        Suppose an ISR executes twice before the main loop processes the flag:
      </p>

      <pre><code>event = 1;
event = 1;</code></pre>

      <p>
        The main program may still only see:
      </p>

      <pre><code>event == 1</code></pre>

      <p>
        The information that two separate events occurred has been lost.
      </p>

      <p>
        When every event matters, an event counter, queue, ring buffer, or
        another event-handling mechanism may be more appropriate.
      </p>

      <h2>My practical rule for volatile</h2>

      <p>
        When I see <code>volatile</code> in embedded C, I ask:
      </p>

      <ol>
        <li>Can this value change outside the code currently being compiled?</li>
        <li>Could hardware modify it?</li>
        <li>Could an ISR modify it?</li>
        <li>Am I confusing compiler visibility with atomicity?</li>
        <li>Do I actually need synchronization as well?</li>
      </ol>

      <p>
        These questions prevent <code>volatile</code> from becoming a magic
        keyword that is added whenever shared data looks suspicious.
      </p>

      <h2>Key takeaway</h2>

      <p>
        <strong>
          volatile is primarily about how the compiler must treat accesses to
          an object. It is not a general-purpose tool for making shared data
          safe.
        </strong>
      </p>

      <p>
        In embedded systems, this distinction matters because interrupts,
        hardware, compilers, and CPUs interact in different ways.
      </p>

      <p>
        A program can be correct from the compiler's point of view and still
        have a concurrency or synchronization problem.
      </p>

      <p>
        That is why <code>volatile</code> should be viewed as one tool in the
        embedded programmer's toolbox—not as a solution to every
        shared-variable problem.
      </p>
    `
  },

  {
    slug: "single-interrupt-flag-miss-events",
    title: "Why a Single Interrupt Flag Can Make You Miss Events",
    category: "Embedded Systems",
    date: "August 30, 2026",
    excerpt:
      "A simple flag looks convenient, but it cannot count multiple events that happen before the main loop processes the flag.",
    content: `
      <p>
        A boolean flag is one of the simplest ways to communicate between an
        interrupt service routine and the main program.
      </p>

      <p>
        But a flag answers only one question:
        <strong>Did something happen?</strong>
      </p>

      <p>
        It does not necessarily answer:
        <strong>How many times did it happen?</strong>
      </p>

      <h2>A simple example</h2>

      <pre><code>volatile int eventFlag = 0;

void ISR(void)
{
    eventFlag = 1;
}

int main(void)
{
    while (1)
    {
        if (eventFlag)
        {
            eventFlag = 0;

            // Handle event
        }
    }
}</code></pre>

      <p>
        This works when the application only cares that at least one event
        occurred.
      </p>

      <h2>Where the problem appears</h2>

      <p>
        Imagine the interrupt occurs twice before the main loop gets a chance
        to process the flag.
      </p>

      <pre><code>ISR #1 → eventFlag = 1
ISR #2 → eventFlag = 1
Main   → sees eventFlag = 1</code></pre>

      <p>
        The main program cannot distinguish one event from two events.
        Both interrupts produced the same final state.
      </p>

      <h2>Better approaches</h2>

      <p>
        If every occurrence matters, consider using an event counter, queue,
        ring buffer, or another mechanism that preserves multiple events.
      </p>

      <h2>Key takeaway</h2>

      <p>
        A flag is useful when the requirement is
        <strong>"at least one event happened."</strong>
        It is not sufficient when the requirement is
        <strong>"process every event."</strong>
      </p>
    `
  },

  {
    slug: "component-orientation-pick-place",
    title: "When Component Orientation Creates Pick-and-Place Problems",
    category: "PCB Design",
    date: "August 30, 2026",
    excerpt:
      "A practical observation: inconsistent component orientation inside a reel can create problems for automated assembly.",
    content: `
      <p>
        While working around a PCB manufacturing issue, I noticed that the
        orientation of components inside a reel does not always appear
        consistent in a real production environment.
      </p>

      <h2>Why this matters</h2>

      <p>
        Pick-and-place machines depend on expected component orientation and
        packaging information.
      </p>

      <p>
        If the actual component orientation does not match that expectation,
        recognition, rotation handling, or placement can fail.
      </p>

      <h2>What I learned</h2>

      <p>
        Component sourcing is not only about electrical specifications.
        Packaging quality, component orientation, and supplier consistency
        can also affect automated assembly.
      </p>

      <h2>Key takeaway</h2>

      <p>
        A component can be electrically correct and still create a
        manufacturing problem if its physical presentation is inconsistent
        with the assembly process.
      </p>
    `
  }
];
