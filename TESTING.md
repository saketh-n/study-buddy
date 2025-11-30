# Testing Guide for Study Buddy

## Quick Start

1. **Start the application:**
   ```bash
   ./dev.sh
   ```

2. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/docs

## Test Cases

### Test 1: Extract Topics from Text

**Input Sample Text:**
```
Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. The process involves the green pigment chlorophyll and generates oxygen as a byproduct.

Newton's First Law of Motion states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.

The Pythagorean Theorem is a fundamental relation in Euclidean geometry among the three sides of a right triangle. It states that the square of the hypotenuse is equal to the sum of the squares of the other two sides.
```

**Expected Result:**
- Multiple flashcards created automatically
- Topics should include: "Photosynthesis", "Newton's First Law", "Pythagorean Theorem", and possibly other related concepts
- Loading animation should appear briefly
- Cards should display without explanations initially

### Test 2: Generate Explanation for a Topic

**Steps:**
1. After flashcards are created, click on any flashcard
2. Card should flip to show the back
3. Click "Generate Explanation" button
4. Observe loading spinner: "Generating explanation..."
5. Explanation should appear (2-4 sentences)
6. Click anywhere on the card to flip back

**Expected Result:**
- Smooth loading animation
- Relevant, educational explanation
- Concise but informative (flashcard-appropriate length)

### Test 3: Multiple Flashcards

**Steps:**
1. Generate flashcards from text
2. Generate explanations for multiple cards
3. Verify each card maintains its own state
4. Click between different cards

**Expected Result:**
- Each card's explanation generates independently
- No interference between cards
- Loading states are per-card, not global

### Test 4: Error Handling

**Test 4a: Network Error**
1. Stop the backend server
2. Try to generate flashcards
3. Verify error message appears

**Test 4b: Invalid API Key**
1. Set invalid ANTHROPIC_API_KEY in backend/.env
2. Restart backend
3. Try to generate flashcards
4. Verify user-friendly error message

**Expected Result:**
- Clear error messages
- Dismissible error banner
- App doesn't crash
- Can retry after fixing the issue

### Test 5: Clear All Functionality

**Steps:**
1. Generate several flashcards
2. Generate explanations for some
3. Click "Clear All Flashcards"
4. Verify all cards are removed

**Expected Result:**
- All flashcards cleared
- Clean slate for new generation
- No errors

### Test 6: UI/UX Testing

**Check these aspects:**
- [ ] Loading spinner is visible and animated
- [ ] Cards have smooth flip animation
- [ ] Hover effects work on cards and buttons
- [ ] Mobile responsive (resize browser window)
- [ ] Text is readable and well-formatted
- [ ] Colors and contrast are good
- [ ] No layout shifts during loading

### Test 7: API Endpoint Testing (Manual)

**Using the Swagger UI (http://localhost:8000/docs):**

1. **Test `/api/extract-topics`:**
   ```json
   {
     "text": "Artificial Intelligence and Machine Learning are transforming technology."
   }
   ```
   Expected: `{ "topics": ["Artificial Intelligence", "Machine Learning", ...] }`

2. **Test `/api/explain-topic`:**
   ```json
   {
     "topic": "Photosynthesis"
   }
   ```
   Expected: Detailed 2-4 sentence explanation

## Performance Benchmarks

- Topic extraction: ~2-5 seconds (depends on text length)
- Explanation generation: ~1-3 seconds per topic
- UI should remain responsive during API calls
- No memory leaks after multiple generations

## Common Issues and Solutions

### Issue: "Failed to generate flashcards"
**Solution:** 
- Check backend is running (http://localhost:8000/health)
- Verify ANTHROPIC_API_KEY is set in backend/.env
- Check console for detailed errors

### Issue: Blank flashcards
**Solution:**
- Check if topics were actually extracted
- Look at network tab in browser DevTools
- Verify API responses

### Issue: Slow response times
**Solution:**
- Claude API calls take 1-5 seconds normally
- Check your internet connection
- Verify Anthropic API status

## Browser Console Testing

Open DevTools Console and verify:
- No JavaScript errors
- API calls are successful (Network tab)
- Proper request/response format

## Example Test Session

```
1. ✓ Paste Wikipedia article about "Solar System"
2. ✓ Click "Generate Flashcards"
3. ✓ Observe loading: "Generating Flashcards..."
4. ✓ 8 flashcards created with topics like "Solar System", "Planets", "Sun", etc.
5. ✓ Click first card
6. ✓ Click "Generate Explanation"
7. ✓ Observe loading spinner
8. ✓ Explanation appears with detailed info about Solar System
9. ✓ Flip back to front
10. ✓ Test other cards similarly
11. ✓ Click "Clear All Flashcards"
12. ✓ All cards cleared
```

## Success Criteria

- [x] Topics are intelligently extracted from text
- [x] Explanations are relevant and educational
- [x] Loading states are clear and visible
- [x] No linter errors
- [x] Error handling works properly
- [x] UI is responsive and smooth
- [x] All features work end-to-end

## Troubleshooting Commands

```bash
# Check backend logs
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Check frontend
cd frontend
npm run dev

# Test API directly
curl -X POST http://localhost:8000/api/extract-topics \
  -H "Content-Type: application/json" \
  -d '{"text": "Test text about science and math"}'
```

