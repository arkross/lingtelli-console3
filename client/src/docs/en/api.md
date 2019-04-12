# Lingtelli Chatbot API

Chatbot API allows more flexible integration with client's existing system and/or applications. To be able to use this API, make sure these requirements are fulfilled:

1. You own a Lingtelli Chatbot Account.
2. You **own a Chatbot** and its **API function is activated**.

Every Chatbot is assigned a unique `vendor_id`. To get started, obtain `vendor_id` from the Chatbot dashboard. Then simply make a `GET` request to [Bot Info](#bot-info), replacing `{vendor_id}` with the proper value.

> If you read this page in Chatbot dashboard, `vendor_id` is already included in the API URL for you.

```http
GET {{{BASE_URL}}}/info
```

If the request returns `200 OK`, you're ready to go.

## Object Structures

This section describes object structures which is used by the API endpoints below.

##### PlainText Structure
| Field | Type | Description |
| ----- | ---- | ----------- |
| `text` | string | User message content |

##### MultipleChoice Structure
| Field | Type | Description |
| ----- | ---- | ----------- |
| `title` | string | Title text which precedes list of choices |
| `buttons` | List of [Postback](#postback-structure) objects | Choices given to user |

##### Postback Structure
| Field | Type | Description |
| ----- | ---- | ----------- |
| `text` | string | User message content |
| `id` | string | Postback ID |
| `oriQue` | string | Original question asked by the user |

##### HistoryRecord Structure
| Field | Type | Description |
| ----- | ---- | ----------- |
| `owner` | string | Either `"BOT"` or `"USER"` |
| `createdAt` | datetime string | Formatted in `YYYY-MM-DDTHH:mm:ss.ssssZ` |
| `message` | [PlainText](#plaintext-structure) object | Message content |

## Bot Info

```http
GET {{{BASE_URL}}}/info
```

Retrieves basic information about a Chatbot. Returns `404 NOT FOUND` on invalid `vendor_id`.

###### Response

| Field | Type | Description |
|---|---|---|
| `robotName` | string | Chatbot Name |
| `activate` | boolean | Fixed value `true` |
| `failedMsg` | string | Message sent by the bot when it fails to understand |
| `greetingMsg` | string | Message sent by the bot in the beginning of conversation |
| `postbackTitle` | string | Postback Title |

###### Example Response Body
```json
{
	"robotName": "Test Robot",
	"activate": true,
	"failedMsg": "Sorry, I don't understand.",
	"greetingMsg": "Hello, how can I help you?",
	"postbackTitle": "I'm not sure I understand your question. Please choose from similar questions below."
}
```


## Message

```http
POST {{{BASE_URL}}}/
```

Post a message to a Chatbot. Returns `403 FORBIDDEN` if Chatbot's API functions is not activated.

User ID (`userId` or `uid`) is used to identify the origin of input (user). Every user should have their unique ID. Same `userId` will be treated as a single origin by the user, which means they will use the same dialogue session, and shares the [History](#history).

In a case which you need to allow **a user to simultaneously chat with the same bot** on different instances and/or topics, it is advised to assign different `userId` on each instance. This way, the instances will be treated as different topics and will not interfere with each other.

A [Postback](#postback-structure) message request may only be sent if the last Chatbot's reply is a [MultipleChoice](#multiplechoice-structure).

###### Request Headers
| Name | Value |
|---|---|
| `Content-Type` | `application/json` |

###### Request Body
| Field | Type | Description |
| ----- | ---- | ----------- |
| `userId` | string | User ID |
| `message` | [PlainText](#plaintext-structure) or [Postback](#postback-structure) object | Message content |
| `type` | string | `"message"` for [PlainText](#plaintext-structure), or `"postback"` for [Postback](#postback-structure) |

###### Example Request using PlainText
```json
{
	"userId": "[random unique string]",
	"message": {
		"text": "What are you capable of?"
	},
	"type": "message"
}
```

###### Example Request using Postback
```json
{
	"userId": "[random unique string]",
	"message": {
		"id": 2131,
		"oriQue": "What are you capable of?",
		"text": "What are your services?"
	},
	"type": "postback"
}
```

Response structure depends on the following factors:

1. Chatbot FAQ setting: **Always reply with similar questions**.
2. Chatbot's understanding of user input.

##### Response Structure Definition

| Setting / Understanding | `answer` | `no_answer` | `error` |
| -- | -- | -- | -- |
| on | [MultipleChoice](#multiplechoice-structure) | [MultipleChoice](#multiplechoice-structure) | [PlainText](#plaintext-structure) |
| off | [PlainText](#plaintext-structure) | [MultipleChoice](#multiplechoice-structure) | [PlainText](#plaintext-structure) |

##### Response Type Definition

1. `"answer"` means the Chatbot comprehends the input and found a matching question in the FAQ set. The Chatbot replies with an answer.
2. `"no_answer"` means the Chatbot comprehends the input, but was unable to confidently find a matching question in the FAQ set. The Chatbot replies with `postbackTitle` and suggests multiple similar questions ([Postback](#postback-structure)) for the user to choose from.
3. `"error"` means the Chatbot fails to comprehend the input, and therefore unable to suggest anything. The Chatbot replies with the `failedMsg` as error message.

###### Response Body
| Field | Type | Description |
| ----- | ---- | ----------- |
| `sender` | string | Fixed value `"BOT"` |
| `type` | string | `"answer"`, `"no_answer"`, or `"error"`. See [Response Type Definiton](#response-type-definition). |
| `state` | string | `"start"`, `"in_progress"`, or `"completed"` |
| `success` | boolean | Indicates if the last message is understood by chatbot. `true` if the bot understands. |
| `uid` | string | User ID |
| `sid` | string | Session ID |
| `oriQue` | string | The question asked by the user |
| `data` | [PlainText](#plaintext-structure) or [MultipleChoice](#multiplechoice-structure) | Reply Message Content. See [Response Structure Definition](#response-structure-definition). |

###### Example Response in PlainText
```json
{
	"sender": "BOT",
	"type": "answer",
	"state": "start",
	"success": true,
	"uid": "[random unique string]",
	"sid": "[system generated session ID]",
	"oriQue": "What are you capable of?",
	"data": {
		"text": "I can provide you with the latest information on weather!"
	}
}
```

###### Example Response in MultipleChoice
```json
{
	"sender": "BOT",
	"type": "answer",
	"state": "start",
	"success": true,
	"uid": "[random unique string]",
	"sid": "[system generated session ID]",
	"oriQue": "What are you capable of?",
	"data": {
		"title": "I can provide you with the latest information on weather!",
		"buttons": [
			{
				"id": 2131,
				"oriQue": "What are you capable of?",
				"text": "What are your services?"
			},
			{
				"id": 2132,
				"oriQue": "What are you capable of?",
				"text": "Who are you looking for?"
			},
			{
				"id": 2133,
				"oriQue": "What are you capable of?",
				"text": "Is there anything you can do?"
			}
		]
	}
}
```
## History

```http
GET {{{WEBHOOK_URL}}}/history
```
Retrieves past chat messages. Please note that the API URL is slightly different with the previous ones.

###### Request Headers
| Name | Value |
|----- |---|
| `Content-Type` | `application/json` |

###### Request Body
| Field | Type | Description |
| ----- | ---- | ----------- |
| `userId` | string | User ID |

###### Response Body
List of [HistoryRecord](#historyrecord-structure) objects.

###### Example Response
```json
[
	{
		"owner": "BOT",
		"createdAt": "2018-10-04T10:24:08.000Z",
		"message": {
			"text": "Hi, I am your test bot!"
		}
	},
	{
		"owner": "USER",
		"createdAt": "2018-10-04T10:24:08.000Z",
		"message": {
			"text": "What are you capable of?"
		}
	}
	...
]
```