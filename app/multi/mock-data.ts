// Mock data for UI development - uncomment the import in multi-chat.tsx to use
export const mockMessageGroups = [
  {
    userMessage: {
      id: "user-1",
      role: "user" as const,
      content:
        "Write a function to calculate fibonacci numbers and explain the difference between recursive and iterative approaches",
    },
    responses: [
      {
        model: "gpt-4.1-nano",
        message: {
          id: "assistant-1-gpt",
          role: "assistant" as const,
          content: `I'll show you both recursive and iterative approaches to calculate Fibonacci numbers:

## Recursive Approach
\`\`\`python
def fibonacci_recursive(n):
    if n <= 1:
        return n
    return fibonacci_recursive(n-1) + fibonacci_recursive(n-2)
\`\`\`

## Iterative Approach
\`\`\`python
def fibonacci_iterative(n):
    if n <= 1:
        return n
    
    a, b = 0, 1
    for i in range(2, n + 1):
        a, b = b, a + b
    return b
\`\`\`

**Key Differences:**
- **Time Complexity**: Recursive O(2^n), Iterative O(n)
- **Space Complexity**: Recursive O(n) due to call stack, Iterative O(1)
- **Performance**: Iterative is much faster for large numbers
- **Readability**: Recursive is more intuitive but inefficient`,
        },
        isLoading: false,
      },
      {
        model: "claude-4-sonnet",
        message: {
          id: "assistant-1-claude",
          role: "assistant" as const,
          content: `Here are both approaches with detailed analysis:

### 1. Recursive Implementation
\`\`\`python
def fib_recursive(n: int) -> int:
    """
    Calculate nth Fibonacci number using recursion.
    Time: O(2^n), Space: O(n)
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n
    
    return fib_recursive(n - 1) + fib_recursive(n - 2)
\`\`\`

### 2. Iterative Implementation
\`\`\`python
def fib_iterative(n: int) -> int:
    """
    Calculate nth Fibonacci number iteratively.
    Time: O(n), Space: O(1)
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n
    
    prev, curr = 0, 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr
    
    return curr
\`\`\`

### Performance Comparison
The recursive approach, while elegant, has exponential time complexity because it recalculates the same values multiple times. The iterative approach is linear and much more efficient for practical use.`,
        },
        isLoading: false,
      },
      {
        model: "deepseek-r1",
        message: {
          id: "assistant-1-deepseek",
          role: "assistant" as const,
          content: `Let me provide you with both implementations and a comprehensive comparison:

\`\`\`javascript
// Recursive approach - elegant but inefficient
function fibonacciRecursive(n) {
    if (n <= 1) return n;
    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

// Iterative approach - efficient and practical
function fibonacciIterative(n) {
    if (n <= 1) return n;
    
    let [a, b] = [0, 1];
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

// Optimized with memoization
function fibonacciMemo(n, memo = {}) {
    if (n in memo) return memo[n];
    if (n <= 1) return n;
    
    memo[n] = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo);
    return memo[n];
}
\`\`\`

**Analysis:**
- Recursive: Beautiful math, terrible performance O(2^n)
- Iterative: Less elegant, but O(n) time and O(1) space
- Memoized: Best of both worlds - readable and O(n) performance`,
        },
        isLoading: false,
      },
      {
        model: "mistral-large-latest",
        message: {
          id: "assistant-1-mistral",
          role: "assistant" as const,
          content: `Here's a comprehensive comparison of Fibonacci implementations:

\`\`\`rust
// Recursive - Simple but exponential time
fn fibonacci_recursive(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2),
    }
}

// Iterative - Linear time, constant space
fn fibonacci_iterative(n: u32) -> u64 {
    if n <= 1 { return n as u64; }
    
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 2..=n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    b
}
\`\`\`

**Trade-offs:**

| Approach | Time | Space | Pros | Cons |
|----------|------|-------|------|------|
| Recursive | O(2^n) | O(n) | Intuitive, matches math definition | Exponentially slow |
| Iterative | O(n) | O(1) | Fast, memory efficient | Less intuitive |

For production code, always use the iterative approach unless n is guaranteed to be very small (< 30).`,
        },
        isLoading: false,
      },
    ],
    onDelete: () => {},
    onEdit: () => {},
    onReload: () => {},
  },
  {
    userMessage: {
      id: "user-2",
      role: "user" as const,
      content: "What are the key differences between React and Vue.js?",
    },
    responses: [
      {
        model: "gpt-4.1-nano",
        message: {
          id: "assistant-2-gpt",
          role: "assistant" as const,
          content: `Here are the key differences between React and Vue.js:

## Learning Curve
- **React**: Steeper learning curve, requires understanding of JSX, state management patterns
- **Vue**: Gentler learning curve, template syntax is closer to HTML

## Architecture
- **React**: Library focused on UI, requires additional tools for routing, state management
- **Vue**: Progressive framework with built-in solutions for routing (Vue Router), state (Pinia/Vuex)

## Performance
- **React**: Virtual DOM with reconciliation algorithm
- **Vue**: Virtual DOM with more optimized reactivity system

## Ecosystem
- **React**: Larger ecosystem, backed by Meta, extensive third-party libraries
- **Vue**: Smaller but growing ecosystem, excellent official tooling

## Code Style
- **React**: JSX, functional components with hooks
- **Vue**: Template-based with options API or composition API

Both are excellent choices depending on your team's needs and project requirements.`,
        },
        isLoading: false,
      },
      {
        model: "claude-4-sonnet",
        message: {
          id: "assistant-2-claude",
          role: "assistant" as const,
          content: `React and Vue.js are both excellent frontend frameworks, but they have distinct philosophies:

**Learning & Development Experience:**
- **React**: JSX-based, requires JavaScript knowledge, steeper initial curve
- **Vue**: Template-based syntax, easier for designers/beginners, gradual adoption possible

**Architecture Philosophy:**
- **React**: "Just a library" - minimal core, ecosystem-driven solutions
- **Vue**: Progressive framework with official solutions for common needs

**State Management:**
- **React**: Multiple options (Redux, Zustand, Context), community-driven
- **Vue**: Official Pinia (formerly Vuex), integrated reactive system

**Performance Characteristics:**
- **React**: Fast with proper optimization, requires careful re-render management
- **Vue**: Built-in optimization, reactive system tracks dependencies automatically

**Community & Ecosystem:**
- **React**: Larger community, extensive job market, Meta backing
- **Vue**: Growing rapidly, excellent developer experience, strong in Asia/Europe

**Syntax Comparison:**
React uses JSX and functional paradigms, while Vue offers both template syntax and JSX, with options or composition APIs.

Choice depends on team experience, project requirements, and organizational preferences.`,
        },
        isLoading: false,
      },
      {
        model: "mistral-large-latest",
        message: {
          id: "assistant-2-mistral",
          role: "assistant" as const,
          content: `React vs Vue.js - A practical comparison:

**Philosophy:**
- **React**: "Learn once, write anywhere" - focuses on being a view library
- **Vue**: "Progressive framework" - can be adopted incrementally

**Syntax & Templates:**
\`\`\`jsx
// React Component
function TodoItem({ todo, onToggle }) {
  return (
    <li onClick={() => onToggle(todo.id)}>
      {todo.text}
    </li>
  );
}
\`\`\`

**Key Differences:**
1. **Bundle Size**: Vue is smaller out-of-the-box
2. **TypeScript**: React has better TS support historically, Vue 3 caught up
3. **Mobile**: React Native vs Vue Native (less mature)
4. **Corporate Backing**: Meta (React) vs Independent (Vue)

**When to Choose:**
- **React**: Large teams, complex apps, need React Native
- **Vue**: Rapid prototyping, smaller teams, template preference`,
        },
        isLoading: false,
      },
    ],
    onDelete: () => {},
    onEdit: () => {},
    onReload: () => {},
  },
]
