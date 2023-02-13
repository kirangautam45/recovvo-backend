import Mixpanel from 'mixpanel';

import config from '../config/config';
const mixpanel = Mixpanel.init(config.mixpanel.token);

/**
 * Tracks event in mixpanel.
 *
 * @param eventName string
 * @param email string
 * @param query string
 */
export function trackEvent(eventName: string, email: string, filter: string) {
  mixpanel.track(eventName, {
    distinct_id: email,
    filter
  });
}

/**
 * Sets user profile in mixpanel
 *
 * @param email string
 * @param firstName string
 * @param lastName string
 * @param role string
 * @param client string
 */
export function setUser(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  client: string
) {
  mixpanel.people.set(email, {
    $email: email,
    $first_name: firstName,
    $last_name: lastName,
    $role: role,
    $client: client
  });
}
