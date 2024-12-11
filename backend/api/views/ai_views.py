from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import spacy
from nltk.corpus import wordnet
from openai import OpenAI
from django.conf import settings
import json

# Initialize spaCy
nlp = spacy.load("en_core_web_sm")

class TestView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"message": "API is working!"})

class AISuggestionsView(APIView):
    permission_classes = [AllowAny]
    
    def get_mock_suggestions(self, text):
        """Generate mock suggestions for development/testing"""
        suggestions = []
        
        # Grammar checks
        if not text.strip().endswith(('.', '!', '?')):
            suggestions.append({
                'type': 'grammar',
                'suggestion': 'Add proper punctuation at the end of your sentence.',
                'confidence': 0.9
            })
        
        if text.lower().startswith('grammer'):
            suggestions.append({
                'type': 'grammar',
                'suggestion': 'Correct spelling: "Grammar" instead of "Grammer"',
                'confidence': 0.95
            })

        # Style suggestions
        if len(text.split()) < 5:
            suggestions.append({
                'type': 'style',
                'suggestion': 'Consider expanding your text to provide more context and detail.',
                'confidence': 0.8
            })

        # Content suggestions
        content_suggestions = [
            'Try adding specific examples to illustrate your point.',
            'Consider adding a topic sentence to better frame your idea.',
            'You might want to elaborate on the importance of grammar in writing.',
            'Consider explaining why grammar is relevant to your context.'
        ]
        
        suggestions.append({
            'type': 'content',
            'suggestion': random.choice(content_suggestions),
            'confidence': 0.7
        })

        return suggestions

    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response(
                {'error': 'Text is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Check if we're in development mode or OpenAI API is not configured
            if not hasattr(settings, 'OPENAI_API_KEY') or not settings.OPENAI_API_KEY:
                # Return mock suggestions
                suggestions = self.get_mock_suggestions(text)
                return Response(suggestions)

            # If OpenAI API is configured, try using it
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful writing assistant. Analyze the text and provide suggestions for improvement in terms of style, clarity, and engagement."},
                        {"role": "user", "content": text}
                    ],
                    temperature=0.7,
                    max_tokens=150
                )
                
                suggestions = []
                if response.choices:
                    suggestions.append({
                        'type': 'content',
                        'suggestion': response.choices[0].message.content,
                        'confidence': 0.9
                    })
                return Response(suggestions)
                
            except Exception as api_error:
                print(f"OpenAI API Error: {str(api_error)}")
                # Fallback to mock suggestions if API fails
                suggestions = self.get_mock_suggestions(text)
                return Response(suggestions)
            
        except Exception as e:
            print(f"General Error: {str(e)}")
            return Response(
                {'error': 'Error processing your request. Please try again later.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WordAnalysisView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, word):
        try:
            # Get WordNet analysis
            synsets = wordnet.synsets(word)
            
            if not synsets:
                return Response([])
            
            analysis = []
            for synset in synsets[:3]:  # Limit to top 3 meanings
                examples = synset.examples()[:3] if synset.examples() else []
                
                analysis.append({
                    'type': 'word-analysis',
                    'suggestion': synset.definition(),
                    'context': synset.name(),
                    'examples': examples,
                    'confidence': 0.8
                })
            
            return Response(analysis)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GrammarCheckView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response(
                {'error': 'Text is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            doc = nlp(text)
            suggestions = []
            
            sentences = list(doc.sents)
            for sent in sentences:
                # Check sentence length
                if len(sent) > 40:
                    suggestions.append({
                        'type': 'grammar',
                        'suggestion': f'Consider breaking this long sentence into smaller ones: "{sent}"',
                        'confidence': 0.7
                    })
                
                # Get tokens list for the sentence
                sent_tokens = [token for token in sent]
                
                # Check for capitalization at the start of sentence
                if sent_tokens and not sent_tokens[0].text[0].isupper():
                    suggestions.append({
                        'type': 'grammar',
                        'suggestion': f'Sentence should start with a capital letter: "{sent}"',
                        'confidence': 0.9
                    })

                # Check for ending punctuation
                if sent_tokens and sent_tokens[-1].text not in ['.', '!', '?']:
                    suggestions.append({
                        'type': 'grammar',
                        'suggestion': f'Sentence should end with proper punctuation: "{sent}"',
                        'confidence': 0.9
                    })
                
                # Check for passive voice
                has_passive = any(token.dep_ == "auxpass" for token in sent)
                if has_passive:
                    suggestions.append({
                        'type': 'grammar',
                        'suggestion': f'Consider using active voice instead of passive voice in: "{sent}"',
                        'confidence': 0.8
                    })

                # Check for subject-verb agreement
                subjects = [token for token in sent if token.dep_ in ('nsubj', 'nsubjpass')]
                verbs = [token for token in sent if token.pos_ == 'VERB']
                
                for subject in subjects:
                    for verb in verbs:
                        # Basic subject-verb agreement check
                        if subject.text.lower() in ['it', 'he', 'she'] and verb.text in ['are', 'were']:
                            suggestions.append({
                                'type': 'grammar',
                                'suggestion': f'Check subject-verb agreement in: "{sent}"',
                                'confidence': 0.8
                            })

                # Check for common tech writing style
                tech_terms = [token.text.lower() for token in sent]
                if 'js' in tech_terms:
                    suggestions.append({
                        'type': 'style',
                        'suggestion': f'Consider using "JavaScript" instead of "js" for better clarity: "{sent}"',
                        'confidence': 0.7
                    })

                # Check for incomplete sentences
                if len(sent_tokens) < 3:
                    suggestions.append({
                        'type': 'grammar',
                        'suggestion': f'This might be an incomplete sentence: "{sent}"',
                        'confidence': 0.7
                    })

            # If no issues found, provide a positive feedback
            if not suggestions:
                suggestions.append({
                    'type': 'feedback',
                    'suggestion': 'The text appears to be grammatically correct, but you might want to expand it for better context.',
                    'confidence': 0.6
                })
            
            return Response(suggestions)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )