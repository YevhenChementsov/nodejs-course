**Читать на других языках: [Українська](./docs/README.ua.md),
[English](./docs/README.en.md).**

# Отправка email при помощи сервиса-посредника SendGrid.

---

Подготовка интеграции с SendGrid API. Создание эндпоинта для верификации email.
Добавление первой и в случае проблемы - повторной отправки email пользователю с
ссылкой для верификации.

---

#### Как процесс верификации должен работать

- После регистрации, пользователь должен получить письмо на указанную при
  регистрации почту с ссылкой для верификации своего email.
- Пройдя ссылке в полученном письме, в первый раз, пользователь должен получить
  [Ответ](#ответ-успешной-верификации) со статусом `200`, что будет
  подразумевать успешную верификацию email.
- Пройдя по ссылке повторно пользователь должен получить
  [Ошибку](#ошибка-верификации) со статусом `404`.

---

### 1. Подготовка интеграции с SendGrid API.

1.1. Регистрация на [Sendgrid](https://sendgrid.com/en-us).

1.2. Создается email отправителя.

- В административной панели SendGrid зайти в меню `Marketing`.
- В подменю `Senders`, в правом верхнем углу, нажать кнопку `Create New Sender`.
- Заполнить необходимые поля в предложенной форме. Сохранить.
- Верифицировать email, указанный в заполненной форме.

<!-- prettier-ignore -->
1.3. Создается API токен доступа.

- В административной панели SendGrid зайти в меню `Email API`.
- В подменю `Integration Guide` - _метод_ выбрать `Web API`, _язык_ выбрать
  `Node.js`.
- Дать имя токену и сгенерировать его. Токен скопировать и сохранить.

> Важно! Токен сохранить нужно обязательно, так как больше его нельзя будет
> посмотреть, только пересоздать.

1.4. Полученный API-токен добавляется в `.env` файл проекта.

---

### 2. Верификация почты пользователя.

2.1. Создается эндпоинт для верификации почты.

- В модель ['User'](./models/user.js) добавляется два поля verificationToken и
  verify. Значение поля verify равное false будет означать, что его email еще не
  прошел верификацию.

```js
// models/user.js
verify: {
  type: Boolean,
  default: false
},
verificationToken: {
  type: String,
  default: null,
}
```

- Создается эндпоинт
  [`/api/auth/verify/:verificationToken`](#запрос-верификации), где по параметру
  verificationToken мы будем искать пользователя в модели
  ['User'](./models/user.js).
- Если пользователь с таким токеном не найден, необходимо вернуть
  [Not Found](#ошибка-верификации).
- Если пользователь найден - устанавливаем verificationToken в `null`, а поле
  verify ставим равным `true` и возвращаем [Ok](#ответ-успешной-верификации).

##### Запрос верификации

```js
@GET /api/auth/verify/:verificationToken
```

##### Ошибка верификации

```js
Status: 404 Not Found
Content-Type: application/json
ResponseBody: {
  "message": "User not found"
}
```

##### Ответ успешной верификации

```js
Status: 200 OK
Content-Type: application/json
ResponseBody: {
  "message": "Verification successful",
}
```

---

### 3. Отправка email пользователю с ссылкой для верификации.

3.1. При регистрации пользователя:

- Создается verificationToken для пользователя и записывается в БД (для
  генерации токена верификации используется пакет
  [uuid](https://www.npmjs.com/package/uuid) или
  [nanoid](https://www.npmjs.com/package/nanoid)).
- Отправляется письмо на почту пользователя и указывается ссылка для верификации
  почты (`/api/auth/verify/:verificationToken`) в сообщении.
- Запрещается авторизация пользователя при не верифицированной почте.

---

### 4. Повторная отправка email пользователю с ссылкой для верификации.

Необходимо предусмотреть, вариант, что пользователь может случайно удалить
письмо, оно может не дойти по какой-то причине к адресату, наш сервис отправки
писем во время регистрации выдал ошибку и т.д.

4.1. Создается эндпоинт
[`/api/auth/verify/`](#повторная-отправка-запроса-верификации).

<details>
<summary>@ POST /api/auth/verify/</summary>

- Получает `body` в формате `{ email }`.
- Если в `body` нет обязательного поля `email`, возвращает json с ключом
  `{"message": "missing required field email"}` и статусом `400`
  [Bad Request](#ошибка-повторной-отправки-верификации-почты).
- Если с `body` все хорошо, выполняет повторную отправку письма с
  verificationToken на указанный email, но только если пользователь не
  верифицирован, и возвращает json с ключом
  `{ message: "Verification email sent"}` со статусом `200`
  [Ok](#успешный-ответ-повторной-отправки-верификации-почты).
- Если пользователь уже прошел верификацию отправляет json с ключом
  `{ message: "Verification has already been passed"}` со статусом `400`
  [Bad Request](#ошибка-повторной-отправки-письма-верифицированному-пользователю).

</details>

##### Повторная отправка запроса верификации

```js
@POST /api/auth/verify/
Content-Type: application/json
RequestBody: {
  "email": "example@example.com"
}
```

##### Ошибка повторной отправки верификации почты

```js
Status: 400 Bad Request
Content-Type: application/json
ResponseBody: <Ошибка от Joi или другой библиотеки валидации>
```

##### Успешный ответ повторной отправки верификации почты

```js
Status: 200 Ok
Content-Type: application/json
ResponseBody: {
  "message": "Verification email sent"
}
```

##### Ошибка повторной отправки письма верифицированному пользователю

```js
Status: 400 Bad Request
Content-Type: application/json
ResponseBody: {
  message: "Verification has already been passed"
}
```
