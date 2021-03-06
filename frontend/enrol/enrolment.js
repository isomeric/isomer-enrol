/*!
 * Isomer - The distributed application framework
 * ==============================================
 * Copyright (C) 2011-2019 Heiko 'riot' Weinen <riot@c-base.org> and others.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

/**
 * @ngdoc function
 * @name isomerFrontendApp.controller:PasswordChangeCtrl
 * @description
 * # PasswordChangeCtrl
 * Controller of the isomerFrontendApp
 */
class Enrol {

    constructor(scope, user, socket, notification, state, timeout) {
        this.scope = scope;
        this.user = user;
        this.socket = socket;
        this.notification = notification;
        this.state = state;
        this.timeout = timeout;

        this.registration_open = null;
        this.success = false;
        this.submitting = false;
        this.invited = false;
        this.enrolled = false;

        this.password_new = '';
        this.password_confirm = '';
        this.mail = '';
        this.username = '';
        this.tos = '/#!/' + 'tos';
        this.accept_tos = false;
        this.captcha = '';

        this.captcha_image = null;
        this.captcha_audio = null;

        let self = this;

        this.socket.listen('isomer.enrol.enrolmanager', function (msg) {
            if (msg.action === 'captcha') {
                console.log('[ENROL] Got captcha:', msg);
                self.captcha_image = msg.data;
            } else if (msg.action === 'invite') {
                if (msg.data[0] === true) {
                    console.log('[ENROL] Invitation was sent');
                    self.success = true;
                    self.invited = true;
                } else {
                    console.log('[ENROL] Error during enrolment');
                    self.notification.add('danger', 'Error', 'Your enrolment did not succeed. You may want to check the form for errors and try again.', 5);
                }
            } else if (msg.action === 'status') {
                self.registration_open = msg.data;
                console.log('[ENROL] Registration open status:', self.registration_open);
                if (msg.data === true) self.get_captcha();
            } else if (msg.action === 'enrol') {
                if (msg.data[0] === false) {
                    self.notification.add('danger', 'Unsuccessful', msg.data[1], 5);
                    self.submitting = false;
                } else {
                    self.notification.add('success', 'Success', msg.data[1], 5);
                    self.success = true;
                    self.enrolled = true;
                }
            }
        });

        if (!user.signedin) {
            this.timeout(function () {
                self.get_registration_status();
            }, 2000);
        }
    }

    get_captcha() {
        console.log('[ENROL] Getting captcha');
        this.captcha_image = null;

        this.socket.send({
            component: 'isomer.enrol.enrolmanager',
            action: 'captcha'
        });
    }

    get_registration_status() {
        console.log('[ENROL] Getting registration open status');

        this.socket.send({
            component: 'isomer.enrol.enrolmanager',
            action: 'status'
        });
    }

    enrol() {
        if (this.password_new !== this.password_confirm) {
            console.log("Unexpected: New passwords don't match!");
            return
        }
        console.log('Transmitting account enrolment request');
        let packet = {
            component: 'isomer.enrol.enrolmanager',
            action: 'enrol',
            data: {
                username: this.username,
                mail: this.mail,
                password: this.password_new,
                captcha: this.captcha.toUpperCase()
            }
        };
        this.socket.send(packet);
        this.submitting = true;
    }

    logout() {
        this.user.logout(true, true);
    }
}

Enrol.$inject = ['$scope', 'user', 'socket', 'notification', '$state', '$timeout'];

export default Enrol;
