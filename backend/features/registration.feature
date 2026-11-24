Feature: Student registration
  As a new student
  I want to register with valid details
  So that I can apply for a hostel bed

  Scenario: Registering with valid details
    Given a registration form with valid details
    When I submit the registration
    Then the registration is accepted

  Scenario: Registering with a short password
    Given a registration form with valid details
    And the password is "12345"
    When I submit the registration
    Then the registration is rejected with "Password must be at least 6 characters"

  Scenario Outline: Year of study must be between 1 and 4
    Given a registration form with valid details
    And the year is "<year>"
    When I submit the registration
    Then the registration is <outcome>

    Examples:
      | year | outcome                                        |
      | 0    | rejected with "Year must be between 1 and 4"   |
      | 1    | accepted                                       |
      | 4    | accepted                                       |
      | 5    | rejected with "Year must be between 1 and 4"   |

