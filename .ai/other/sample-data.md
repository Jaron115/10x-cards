# Sample Test Data for API Testing

## Valid Source Texts (1000+ characters)

### 1. React Content (1147 characters)

```
React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components and manage the state of their applications efficiently. The library uses a virtual DOM to optimize rendering performance, which means that instead of updating the entire page, React only updates the parts that have changed. This approach significantly improves the speed and efficiency of web applications. React components can be either functional or class-based, with modern React development heavily favoring functional components combined with Hooks. Hooks, introduced in React 16.8, allow developers to use state and other React features without writing a class. The most commonly used Hooks are useState for managing component state and useEffect for handling side effects like data fetching or subscriptions. React's component-based architecture promotes code reusability and maintainability, making it easier to build and scale complex applications. The library also supports server-side rendering through Next.js and other frameworks, which can improve initial page load times and SEO performance.
```

### 2. TypeScript Content (1165 characters)

```
TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It was developed and is maintained by Microsoft. TypeScript adds optional static typing to JavaScript, which can help catch errors early in the development process through type checking. The type system in TypeScript is structural, meaning it focuses on the shape that values have rather than nominal typing found in languages like Java or C#. TypeScript code is transpiled to JavaScript, which means it can run anywhere JavaScript runs: in browsers, on Node.js, or in any JavaScript engine. One of the key benefits of TypeScript is enhanced IDE support, with features like autocomplete, type checking, and refactoring tools that make development more efficient. TypeScript supports modern JavaScript features including async/await, destructuring, and arrow functions, while also providing additional features like interfaces, enums, generics, and decorators. The language has gained massive adoption in the web development community, with many popular frameworks and libraries, including React, Vue, and Angular, providing excellent TypeScript support.
```

### 3. Python Content (1224 characters)

```
Python is a high-level, interpreted programming language known for its simplicity and readability. Created by Guido van Rossum and first released in 1991, Python has become one of the most popular programming languages in the world. Its design philosophy emphasizes code readability with the use of significant whitespace and clear, expressive syntax. Python supports multiple programming paradigms, including procedural, object-oriented, and functional programming. The language features dynamic typing and automatic memory management, making it easier for developers to write and maintain code. Python's extensive standard library provides modules and packages for various tasks, from web development to scientific computing. The language has a large and active community that contributes to a rich ecosystem of third-party packages available through the Python Package Index (PyPI). Python is widely used in many domains, including web development with frameworks like Django and Flask, data science and machine learning with libraries like NumPy, Pandas, and TensorFlow, automation and scripting, and scientific computing. The language's versatility and ease of learning make it an excellent choice for beginners while still being powerful enough for experienced developers working on complex projects.
```

### 4. Minimal Valid (exactly 1000 characters)

```
ABCDEFGHIJ KLMNOPQRST UVWXYZABCD EFGHIJKLMN OPQRSTUVWX YZABCDEFGH IJKLMNOPQR STUVWXYZAB CDEFGHIJKL MNOPQRSTUV WXYZABCDEF GHIJKLMNOP QRSTUVWXYZ ABCDEFGHIJ KLMNOPQRST UVWXYZABCD EFGHIJKLMN OPQRSTUVWX YZABCDEFGH IJKLMNOPQR STUVWXYZAB CDEFGHIJKL MNOPQRSTUV WXYZABCDEF GHIJKLMNOP QRSTUVWXYZ ABCDEFGHIJ KLMNOPQRST UVWXYZABCD EFGHIJKLMN OPQRSTUVWX YZABCDEFGH IJKLMNOPQR STUVWXYZAB CDEFGHIJKL MNOPQRSTUV WXYZABCDEF GHIJKLMNOP QRSTUVWXYZ ABCDEFGHIJ KLMNOPQRST UVWXYZABCD EFGHIJKLMN OPQRSTUVWX YZABCDEFGH IJKLMNOPQR STUVWXYZAB CDEFGHIJKL MNOPQRSTUV WXYZABCDEF GHIJKLMNOP QRSTUVWXYZ ABCDEFGHIJ KLMNOPQRST UVWXYZABCD EFGHIJKLMN OPQRSTUVWX YZABCDEFGH IJKLMNOPQR STUVWXYZAB CDEFGHIJKL MNOPQRSTUV WXYZABCDEF GHIJKLMNOP QRSTUVWXYZ ABCDEFGHIJ KLMNOPQRST UVWXYZABCD EFGHIJKLMN OPQRSTUVWX YZABCDEFGH IJKLMNOPQR STUVWXYZAB CDEFGHIJKL MNOPQRSTUV WXYZABCDEF GHIJKLMNOP QRSTUVWXYZ ABCDEFGHIJ
```

## Invalid Source Texts (for error testing)

### Too Short (< 1000 characters)

```
This text is way too short to be accepted by the API validation.
```

### Empty String

```

```

### Only Whitespace

```
     
```

## cURL Examples

### Successful Request

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components and manage the state of their applications efficiently. The library uses a virtual DOM to optimize rendering performance, which means that instead of updating the entire page, React only updates the parts that have changed. This approach significantly improves the speed and efficiency of web applications. React components can be either functional or class-based, with modern React development heavily favoring functional components combined with Hooks. Hooks, introduced in React 16.8, allow developers to use state and other React features without writing a class. The most commonly used Hooks are useState for managing component state and useEffect for handling side effects like data fetching or subscriptions. React's component-based architecture promotes code reusability and maintainability, making it easier to build and scale complex applications. The library also supports server-side rendering through Next.js and other frameworks, which can improve initial page load times and SEO performance."
}
EOF
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "generation_id": 1,
    "model": "openai/gpt-4 (mock)",
    "duration_ms": 2347,
    "generated_count": 5,
    "flashcards_proposals": [
      {
        "front": "What is the main topic covered in this text?",
        "back": "The text discusses various concepts related to the subject matter (React is a JavaScript library for building user in...).",
        "source": "ai-full"
      },
      {
        "front": "What are the key points mentioned?",
        "back": "The key points include fundamental concepts, practical applications, and important considerations for implementation.",
        "source": "ai-full"
      },
      {
        "front": "How can this information be applied?",
        "back": "This information can be applied in real-world scenarios by following the guidelines and best practices outlined in the content.",
        "source": "ai-full"
      },
      {
        "front": "What is the significance of this topic?",
        "back": "This topic is significant because it addresses fundamental aspects that are essential for understanding the broader context.",
        "source": "ai-full"
      },
      {
        "front": "What are the benefits of understanding this material?",
        "back": "Understanding this material provides a solid foundation for further learning and enables practical application of the concepts.",
        "source": "ai-full"
      }
    ]
  }
}
```

### Error Request (Too Short)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Too short"}'
```

### Expected Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Source text must be at least 1000 characters long",
    "details": {
      "field": "source_text",
      "current_length": 9,
      "min_length": 1000,
      "max_length": 10000
    }
  }
}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
async function generateFlashcards(sourceText: string) {
  try {
    const response = await fetch('http://localhost:4321/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_text: sourceText,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const result = await response.json();
    console.log('Generated flashcards:', result.data.flashcards_proposals);
    return result.data;
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
    throw error;
  }
}

// Usage
const text = "Your text here (1000+ characters)...";
generateFlashcards(text)
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### Using Axios

```typescript
import axios from 'axios';

async function generateFlashcards(sourceText: string) {
  try {
    const response = await axios.post('http://localhost:4321/api/generations', {
      source_text: sourceText,
    });

    console.log('Generated flashcards:', response.data.data.flashcards_proposals);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error:', error.response.data.error);
      throw new Error(error.response.data.error.message);
    }
    throw error;
  }
}
```

## Testing Checklist

### Success Cases
- [ ] Valid text (1000-10000 characters)
- [ ] Minimum length (exactly 1000 characters)
- [ ] Maximum length (exactly 10000 characters)
- [ ] Text with special characters
- [ ] Text with Unicode characters
- [ ] Multiple paragraph text

### Error Cases
- [ ] Text too short (< 1000 characters)
- [ ] Text too long (> 10000 characters)
- [ ] Empty string
- [ ] Only whitespace
- [ ] Missing source_text field
- [ ] Invalid JSON
- [ ] Wrong Content-Type header

### Edge Cases
- [ ] Text with leading/trailing whitespace (should be trimmed)
- [ ] Text with 999 characters (should fail)
- [ ] Text with 1001 characters (should succeed)
- [ ] Text with 9999 characters (should succeed)
- [ ] Text with 10001 characters (should fail)

## Performance Testing

### Expected Response Times (Development with Mock)

- Validation: < 10ms
- Mock generation: 2000-3000ms (simulated delay)
- Database save: < 100ms
- Total: ~2100-3100ms

### Load Testing Example (using Apache Bench)

```bash
# Simple load test (10 requests, 1 concurrent)
ab -n 10 -c 1 -p request.json -T application/json http://localhost:4321/api/generations
```

Where `request.json` contains:
```json
{
  "source_text": "Your 1000+ character text here..."
}
```

