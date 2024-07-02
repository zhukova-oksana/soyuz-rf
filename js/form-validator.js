(function( $ ){
    $.fn.formValidator = function( options ) {
        var settings = $.extend( {}, {
            errorMessages               : {},

            successSendOkText           : 'Данные отправлены',
            successSendErrorText        : 'В форме присутствуют ошибки',

            useRecaptcha                : false,
            recaptchaKeyV2              : null,
            recaptchaKeyV3              : null,

            beforeSendFormCallback      : null,
            successSendFormCallback     : null,
            errorSendFormCallback       : null,
            completeSendFormCallback    : null,

            scrollToFirstInvalidElement : false,

            errorMessageTag             : 'div',
            errorMessageClass           : 'invalid-feedback',
            errorElementClass           : 'is-invalid',

            dataType                    : 'json',

            debugMode                   : 0
        }, options);

        logDebug().level1('Start plugin', this, settings);

        var availableMethods = {
            'renderRecaptcha'                       : renderRecaptcha,
            'isValid'                               : isValid,
            'scrollToFirstInvalidElement'           : scrollToFirstInvalidElement,
            'isGroupElement'                        : isGroupElement,
            'checkEmail'                            : checkEmail,
            'checkTel'                              : checkTel,
            'validateElement'                       : validateElement,
            'insertErrorMessage'                    : insertErrorMessage,
            'renderErrorMessage'                    : renderErrorMessage,
            'deleteErrorMessage'                    : deleteErrorMessage,
            'deleteAllErrorMessages'                : deleteAllErrorMessages,
            'findErrorMessage'                      : findErrorMessage,
            'getErrorMessageContainerForCheckbox'   : getErrorMessageContainerForCheckbox,
            'fillErrors'                            : fillErrors,
            'sendFormHandler'                       : sendFormHandler,
            'sendForm'                              : sendForm,
            'beforeSendFormCallback'                : beforeSendFormCallback,
            'successSendFormCallback'               : successSendFormCallback,
            'errorSendFormCallback'                 : errorSendFormCallback,
            'completeSendFormCallback'              : completeSendFormCallback,
            'showV2Recaptcha'                       : showV2Recaptcha,
            'logDebug'                              : logDebug,
            'log'                                   : log,
        };

        if (availableMethods[options]) {
            return availableMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        }

        return this.each(function(index, element) {
            var $form           = $(this);
            var formState       = {
                $submitButton           : $('[type=submit]', $form),
                $formElements           : $('input, select, textarea', $form),

                $grecaptchaVersion      : $('[name="g-recaptcha-version"]', $form),
                grecaptchaWidgetId      : 'unrendered',
                $grecaptchaV2Container  : $('.g-recaptcha-container-v2', $form),
                $grecaptchaV2Input      : $('[name="g-recaptcha-response-v2"]', $form),
                $grecaptchaV3Input      : $('[name="g-recaptcha-response-v3"]', $form),
                methods                 : availableMethods
            }

            $form.on('change blur', 'input, select, textarea', function () {
                validateElement($(this));
            });

            $form.on('click focus', 'input, select, textarea', function () {
                deleteErrorMessage($(this));
            });

            $form.on('keydown', '[type = number]', function (event) {
                if (
                    event.keyCode == 46  || event.keyCode == 8   || event.keyCode == 9 || event.keyCode == 27 ||    // backspace, delete, tab и escape
                    event.keyCode == 190 || event.keyCode == 110 ||                                                 // точка и NumPud точка
                    event.keyCode == 173 || event.keyCode == 109 ||                                                 // - и NumPud -
                    (event.keyCode == 65 && event.ctrlKey === true) ||                                              // Ctrl+A
                    (event.keyCode >= 35 && event.keyCode <= 39)                                                    // home, end, влево, вправо
                ) {
                    return;
                } else {
                    if ((event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                        event.preventDefault();
                    }
                }
            });

            $form.on('input keydown keyup keypress', '.cyrillic-only', function (event) {
                var $this = $(this);
                $this.val($this.val().replace(/[^а-яА-ЯёЁ \,\-]/ig,''));
            });

            $form.on('input keydown keyup keypress', 'input[type="email"], input[name="email"], .to-lower-case', function (event) {
                var $this = $(this);
                $this.val($this.val().toLowerCase());
            });

            $form.on('input keydown keyup keypress', '.to-upper-case', function (event) {
                var $this = $(this);
                $this.val($this.val().toUpperCase());
            });

            renderRecaptcha($form, formState);

            formState.$submitButton.off('click');
            formState.$submitButton.on('click', function (e) {
                e.preventDefault();

                logDebug().level5('$form.on.submit handler', $form, formState)

                if (isValid($form, formState)) {
                    sendFormHandler($form, formState)
                }
            })
        });

        function renderRecaptcha($form, formState) {
            logDebug().level1('function renderRecaptcha');
            if (!settings.useRecaptcha) {
                return;
            }

            if (!formState.$grecaptchaVersion.length) {
                formState.$grecaptchaVersion = $('<input/>', {
                    type: 'hidden',
                    name: 'g-recaptcha-version',
                    value: 3
                });

                formState.$grecaptchaVersion.insertBefore(formState.$submitButton);
            }

            if (!formState.$grecaptchaV2Input.length) {
                formState.$grecaptchaV2Input = $('<input/>', {
                    type: 'hidden',
                    name: 'g-recaptcha-response-v2'
                });

                formState.$grecaptchaV2Input.insertBefore(formState.$submitButton);
            }

            if (!formState.$grecaptchaV3Input.length) {
                formState.$grecaptchaV3Input = $('<input/>', {
                    type: 'hidden',
                    name: 'g-recaptcha-response-v3'
                });

                formState.$grecaptchaV3Input.insertBefore(formState.$submitButton);
            }

            if (!formState.$grecaptchaV2Container.length) {
                formState.$grecaptchaV2Container = $('<div/>', {
                    class: 'g-recaptcha-container-v2',
                    style: 'display:none;'
                });

                formState.$grecaptchaV2Container.insertBefore(formState.$submitButton);
            }
        }

        function isValid($form, formState) {
            logDebug().level1('function isValid');

            var $firstInvalidElement    = null;
            var errorsCount         = 0;
            var $formElements       = $('input, select, textarea', $form);
            $formElements.each(function (index) {
                var $element = $(this);
                logDebug().level5('function isValid each element ' + index, $element);
                if (validateElement($element)) {
                    logDebug().level5('isElementInvalid');

                    if (!$firstInvalidElement) {
                        $firstInvalidElement = $element;
                    }

                    errorsCount++;
                }
            });

            if (errorsCount > 0) {
                scrollToFirstInvalidElement($firstInvalidElement);

                return false;
            } else {
                return true;
            }
        }

        function scrollToFirstInvalidElement($firstInvalidElement) {
            if (settings.scrollToFirstInvalidElement && $firstInvalidElement && $firstInvalidElement.length) {
                $(document).scrollTop($firstInvalidElement.offset().top - 120);
            }
        }

        function isGroupElement(elementType) {
            return elementType === 'checkbox' || elementType === 'radio';
        }

        function checkEmail(email) {
            var regex   = /^([а-яА-ЯёЁa-zA-Z0-9_\.\-\+])+\@(([а-яА-ЯёЁa-zA-Z0-9\-])+\.)+([а-яА-ЯёЁa-zA-Z0-9]{2,4})+$/;
            return regex.test(email);
        }

        function checkTel(tel) {
            tel = tel.replace( /[^0-9]/g, '' );
            return tel.length === 11;
        }

        function validateElement($element, errorMessage) {
            var errorsCount = 0;

            try {
                var elementValue = $element.val().trim();
            } catch (exception) {
                elementValue = null;
            }
            var elementName = $element.attr('name');
            var elementType = $element.attr('type');

            if ($element.prop('disabled') || elementType === 'hidden') {
                return errorsCount;
            }

            if (isGroupElement(elementType) && ($element.prop('required') || $element.data('required'))) {
                var elementsGroup = $('input[name="' + elementName + '"]', $element.parents('form').first());
                if (elementsGroup.length) {
                    var groupHasChecked = false;
                    var $lastElement;
                    elementsGroup.each(function () {
                        $lastElement = $(this);
                        if ($lastElement.prop('checked')) {
                            groupHasChecked = true;
                        }
                    });

                    if (groupHasChecked) {
                        $element.data('required', true);
                        elementsGroup.prop('required', false);
                        deleteErrorMessage($lastElement);
                    } else {
                        errorsCount++;
                        elementsGroup.prop('required', true);
                        insertErrorMessage($lastElement, errorMessage);
                    }
                }

                return errorsCount;
            }

            if ($element.prop('required')) {
                if (elementValue === '' || elementValue === null) {
                    insertErrorMessage($element, errorMessage);
                    errorsCount++;
                }
            }

            if ($element.attr('type') === 'text' && elementValue !== '') {
                var minlength = parseInt($element.attr('minlength'));
                var maxlength = parseInt($element.attr('maxlength'));
                var length_error_msg   = '';

                elementValue = '' + elementValue;

                if (!isNaN(minlength) && elementValue.length < minlength) {
                    length_error_msg += 'Длинна строки должна быть больше ' + minlength;
                    errorsCount++;
                }

                if (!isNaN(maxlength) && elementValue.length > maxlength) {
                    length_error_msg += 'Длинна строки должна быть меньше ' + maxlength;
                    errorsCount++;
                }

                if (length_error_msg !== '') {
                    insertErrorMessage($element, length_error_msg);
                }
            }

            if (($element.attr('type') === 'email' || $element.attr('name') === 'email') && elementValue !== '') {
                if (!checkEmail(elementValue)) {
                    insertErrorMessage($element, 'Введен некорректный адрес электронной почты');
                    errorsCount++;
                }
            }

            if ($element.attr('type') === 'tel' && elementValue !== '') {
                if (!checkTel(elementValue)) {
                    insertErrorMessage($element, 'Введен некорректный номер телефона');
                    errorsCount++;
                }
            }

            if ($element.attr('type') === 'number' && elementValue !== '') {
                var min         = parseInt($element.attr('min'));
                var max         = parseInt($element.attr('max'));
                var error_msg   = '';

                elementValue = parseInt(elementValue);

                if (isNaN(elementValue)) {
                    error_msg += 'Значение должно быть числом';
                    errorsCount++;
                } else {
                    if (!isNaN(min) && elementValue < min) {
                        error_msg += 'Значение должно быть больше ' + min;
                        errorsCount++;
                    }

                    if (!isNaN(max) && elementValue > max) {
                        error_msg += 'Значение должно быть меньше ' + max;
                        errorsCount++;
                    }
                }

                if (error_msg !== '') {
                    insertErrorMessage($element, error_msg);
                }
            }

            // if (typeof settings.elements_validators[elementName] === 'function') {
            //     var validation = settings.elements_validators[elementName](elementValue);
            //     if (!validation.result) {
            //         insertErrorMessage(validation.message || null);
            //         errorsCount++;
            //     }
            // }

            return errorsCount;
        }

        function insertErrorMessage($element, message) {
            logDebug().level1('function insertErrorMessage');
            logDebug().level5($element);

            var elementName = $element.attr('name')
            var elementType = $element.attr('type')
            var errorClass  = $element.data('error-class')

            message = message || (settings.errorMessages[elementName] || settings.errorMessages['']);

            $element.addClass(settings.errorElementClass);
            $element = getErrorMessageContainerForCheckbox($element, elementType);
            logDebug().level5($element);
            logDebug().level2('findErrorMessage', findErrorMessage($element, elementType));
            if (findErrorMessage($element, elementType).length < 1 && message) {
                message = renderErrorMessage(message, errorClass);
                logDebug().level5('message: ' + message);
                if (isGroupElement(elementType)) {
                    $element.append(message);
                } else {
                    $element.after(message);
                }
            }
        }

        function renderErrorMessage(message, errorClass) {
            var msg = '';
            if (typeof message === 'string') {
                msg+=  message;
            } else {
                $.each(message, function (key, message) {
                    msg+= message + '</br>';
                });
            }

            errorClass = errorClass ? ' ' + errorClass : '';

            return '<' + settings.errorMessageTag + ' class="' + settings.errorMessageClass + errorClass + '">' + msg + '</>';
        }

        function deleteErrorMessage($element) {
            logDebug().level1('function deleteErrorMessage');
            logDebug().level5($element);

            var elementType = $element.attr('type');

            $element.removeClass(settings.errorElementClass);
            $element = getErrorMessageContainerForCheckbox($element, elementType);
            findErrorMessage($element, elementType).remove();
        }

        function deleteAllErrorMessages($form) {
            logDebug().level1('function deleteAllErrorMessage');

            $('input, select, textarea', $form).each(function () {
                deleteErrorMessage($(this))
            });
        }

        function findErrorMessage($element, elementType) {
            if (isGroupElement(elementType)) {
                return $element.find(settings.errorMessageTag + '.' + settings.errorMessageClass);
            }

            return $element.siblings(settings.errorMessageTag + '.' + settings.errorMessageClass);
        }

        function getErrorMessageContainerForCheckbox($element, elementType) {
            if (typeof settings.getErrorMessageContainerForCheckbox === 'function') {
                return settings.getErrorMessageContainerForCheckbox($element, elementType);
            }

            if (elementType !== 'checkbox' && elementType !== 'radio') {
                return $element;
            }

            var $tmpElement = $element.parent('label');

            if (!$tmpElement.length) {
                $tmpElement = $element.parent('div');
            }

            if ($tmpElement.length) {
                $element = $tmpElement
            }

            return $element;
        }

        function fillErrors($form, errors, arrayName) {
            if (errors) {
                var $firstInvalidElement;
                arrayName = arrayName || '';

                $.each(errors, function (fieldName, error) {
                    if (arrayName !== '') {
                        fieldName = arrayName + '[' + fieldName + ']';
                    }

                    var $element = $('[name="' + fieldName + '"]', $form);
                    if (!$firstInvalidElement) { $firstInvalidElement = $element; }

                    deleteErrorMessage($element);
                    insertErrorMessage($element, error);
                });

                scrollToFirstInvalidElement($firstInvalidElement);
            }
        }

        function sendFormHandler($form, formState) {
            logDebug().level1('function sendFormHandler');

            if (!settings.useRecaptcha) {
                sendForm($form, formState);
                return;
            }

            if (formState.$grecaptchaVersion.val() == 3) {
                formState.$submitButton.prop('disabled', true);

                grecaptcha
                    .execute(settings.recaptchaKeyV3, {action: 'submit'})
                    .then(function(token) {
                        formState.$grecaptchaV3Input.val(token);

                        sendForm($form, formState);
                    })
                ;
            } else {
                sendForm($form, formState);
                formState.$grecaptchaVersion.val(3);
            }

        }

        function sendForm($form, formState) {
            logDebug().level1('function sendForm');

            if ($form.attr('enctype') === 'multipart/form-data') {
                $.ajaxSetup({
                    contentType     : false,
                    processData     : false,
                    data            : new FormData($form.get(0))
                });
            } else {
                $.ajaxSetup({
                    contentType     : 'application/x-www-form-urlencoded',
                    processData     : true,
                    data            : $form.serialize()
                });
            }

            $.ajax({
                type        : $form.attr('method') || 'POST',
                url         : $form.attr('action') || '',
                // async       : false,
                dataType    : settings.dataType,
                beforeSend: function (jqXHR, ajaxSettings) {
                    beforeSendFormCallback(jqXHR, ajaxSettings, $form, formState);
                },
                success: function (response, textStatus, jqXHR) {
                    successSendFormCallback(response, textStatus, jqXHR, $form, formState);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    errorSendFormCallback(jqXHR, textStatus, errorThrown, $form, formState);
                },
                complete: function (jqXHR, textStatus) {
                    completeSendFormCallback(jqXHR, textStatus, $form, formState);
                },
            });

            $.ajaxSetup({
                contentType     : 'application/x-www-form-urlencoded',
                processData     : true,
                data            : null
            });
        }

        function beforeSendFormCallback (jqXHR, ajaxSettings, $form, formState) {
            logDebug().level1('function beforeSendFormCallback (jqXHR, settings, $form, formState)', jqXHR, ajaxSettings);
            deleteAllErrorMessages($form)

            if (typeof settings.beforeSendFormCallback === 'function') {
                return settings.beforeSendFormCallback(jqXHR, ajaxSettings, $form, formState, settings);
            }

            formState.$submitButton.prop('disabled', true);
        }

        function successSendFormCallback (response, textStatus, jqXHR, $form, formState) {
            logDebug().level1('function successSendFormCallback (response, textStatus, jqXHR, $form, formState)');
            logDebug().level5(response, textStatus, jqXHR);

            if (settings.useRecaptcha && response.errors && response.errors.recaptcha) {
                showV2Recaptcha($form, formState);
                alert('Вы не прошли автоматическую проверку на робота, пройдите проверку в ручном режиме');

                return;
            }

            if (typeof settings.successSendFormCallback === 'function') {
                return settings.successSendFormCallback(response, textStatus, jqXHR, $form, formState, settings);
            }

            if (response.result) {
                $form[0].reset();
                alert(settings.successSendOkText);
            } else {
                typeof response.errors === 'object'
                    ? fillErrors($form, response.errors)
                    : alert(settings.successSendErrorText);
            }
        }

        function errorSendFormCallback (jqXHR, textStatus, errorThrown, $form, formState) {
            logDebug().level1('function errorSendFormCallback (jqXHR, textStatus, errorThrown)');
            logDebug().level5(jqXHR, textStatus, errorThrown);

            if (typeof settings.errorSendFormCallback === 'function') {
                return settings.errorSendFormCallback(jqXHR, textStatus, errorThrown, $form, formState, settings);
            }

            const status = parseInt(jqXHR.status);
            if (status === 422) {
                if (!jqXHR.responseJSON.errors) {
                    return;
                }

                if (settings.useRecaptcha && jqXHR.responseJSON.errors.recaptcha) {
                    showV2Recaptcha($form, formState);
                    alert('Вы не прошли автоматическую проверку на робота, пройдите проверку в ручном режиме');
                }

                if (jqXHR.responseJSON.errors) {
                    fillErrors($form, jqXHR.responseJSON.errors);
                }

                return;
            } else if (status === 301 || status === 302) {

            }

            alert('Ошибка отправки формы');
        }

        function completeSendFormCallback (jqXHR, textStatus, $form, formState) {
            logDebug().level1('function completeSendFormCallback (jqXHR, textStatus, $form, formState)');
            logDebug().level5(jqXHR, textStatus);

            if (typeof settings.completeSendFormCallback === 'function') {
                return settings.completeSendFormCallback(jqXHR, textStatus, $form, formState, settings);
            }

            formState.$submitButton.prop('disabled', false);
        }

        function showV2Recaptcha($form, formState) {
            logDebug().level1('function showV2Recaptcha');

            formState.$submitButton.hide();
            formState.$grecaptchaV2Container.show();
            if (formState.grecaptchaWidgetId === 'unrendered') {
                formState.grecaptchaWidgetId = grecaptcha.render(formState.$grecaptchaV2Container[0], {
                    'sitekey'           : settings.recaptchaKeyV2,
                    'callback'          : function (token) {
                        logDebug().level5('recaptcha callback success / token:', token);

                        formState.$grecaptchaV2Input.val(token);

                        formState.$grecaptchaV2Container.hide();
                        formState.$submitButton.show();
                        formState.$submitButton.trigger('click');

                        grecaptcha.reset(formState.grecaptchaWidgetId);
                    },
                    'expired-callback'  : function () {
                        logDebug().level1('recaptcha callback expired');

                    },
                    'error-callback'    : function () {
                        logDebug().level1('recaptcha callback error');

                        formState.$grecaptchaV2Container.show();
                    },
                });
            }

            formState.$grecaptchaVersion.val(2);
        }

        function logDebug() {
            return {
                level1 : function () { log(1, arguments) },
                level2 : function () { log(2, arguments) },
                level3 : function () { log(3, arguments) },
                level4 : function () { log(4, arguments) },
                level5 : function () { log(5, arguments) },
            }
        }

        function log(level, logData) {
            if (level > settings.debugMode) { return; }

            for (var i = 0; i < logData.length; i++) {
                console.log(logData[i]);
            }
        }
    };
})( jQuery );
