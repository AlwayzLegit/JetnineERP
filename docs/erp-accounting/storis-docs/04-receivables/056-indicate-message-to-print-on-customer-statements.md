---
title: Indicate Message to Print on Customer Statements
article_id: 15202312119828
section: 04-receivables
index: 56
url: https://storis.zendesk.com/hc/en-us/articles/15202312119828-Indicate-Message-to-Print-on-Customer-Statements
source: STORIS Help Center (storis.zendesk.com)
---

Access

Accounting > Revolving Receivables > Statements > Indicate Message to Print on Customer Statements

Tabs: Criteria, Customer

Use this routine to link statement messages to one or more plans, states and/or store locations and to assign or exclude messages for specific customers. During creation of the customer's statement, the process selects the appropriate statement messages based on the following:

Messages assigned to the customer's revolving plan, state, and/or store

Messages assigned or excluded for the specified customer

Criteria

Use the Criteria tab to assign messages to criteria (i.e. plan, state, and store). You can assign messages to one or more plans, states and/or store locations. Using the options on this screen, you can choose any combination of plans, states and/or stores, or select All plans, states, and/or stores.

Message Code Message Code

Indicate the code of the message you want to assign. The code you enter here must already have been established via Enter Statement Messages. If you click the Search button, you access a Read-Only Lookup Window listing the message codes on your system. You can choose a code from this list. Once you indicate the message code, the message text displays and the Plan, State, and Store fields become active.

NOTE:Important If you indicate a message that has expired, a warning message displays and you have the option to continue. You can click Yes to continue with the message assignment, but you must change the expiration date of the message in order for it to print on statements. After you complete and save your message assignments on this screen, access Enter Statement Messages and change or delete the Expires date to re-activate the message.

Plan Plan

You can use this field to assign the selected message to specific plans. If you click the Arrow button you can select a single revolving plan from the drop-down list. If you click the Action button and access the Restricted Payment Type Entry window, you can select multiple revolving plans. If you leave this field blank, you are selecting All plans.

State State

Use this field to assign the selected message to specific states. If you click the Arrow button, a list of states appears from which you can select one or more. If you click the Action button, the Multiple Tax Jurisdiction Selection Window appears from which you can select one or more state codes. If you leave this field blank, you select All states. When you select one or multiple specific states, the Store field becomes inactive.

Store Store

You can use this field to assign the selected message to specific store locations. If you click the Arrow button you can select a single store from the drop-down list. If you click the Action button and access the Multiple Location Selection Window, you can select multiple stores. If you leave this field blank, you are selecting all stores. When you select one or multiple specific stores, the State field becomes inactive.

Once a message has been assigned to plans, states, and/or stores, you can exclude the message from printing on a specific customer's statement using the Customer tab on this screen.

Manage MessageManage Message

You must enter a Message Code in order for this button to be active. To view and maintain criteria assigned to a specific message, click this extra action button and access the Manage Statement Messages window.

Manage CriteriaManage Criteria

This action button is available only until you indicate a Message Code. To view messages currently assigned to selected criteria, click this button and access the Manage Statement Message Criteria Assignment window.

To update your message assignment selections, click the Save button.

Customer

Use the Customer tab to manually assign messages to a specific customer, remove a customer's manually assigned messages, or exclude a customer's messages that were assigned via the Criteria tab.

Customer Customer

Specify the customer for whom you are updating revolving message assignments. To locate a customer code, click the Search button and access the Search for a Customer screen. Once you have selected the customer, any messages already assigned to this customer are displayed in the grid and the Message Code field is active.

Message Code Message Code

Indicate the message you are adding or removing by entering the message number or by selecting it from the grid. To locate a message, click the Search button and access the Read-Only Lookup Window.

To assign a new message to the selected customer, indicate the message code and click the Add button to update the grid.

To exclude or remove a message previously assigned, double-click to select the line from the grid. If you manually assigned the message, the Exclude option is not available; click the Remove button to un-assign the message. If the message was assigned using the Criteria tab, see the Exclude field below.

Exclude Exclude

If the message was assigned using criteria you entered on the Criteria tab, the Exclude option is available. To exclude the message from this customer's statement, click the Exclude check box and then click the Add button to update the grid. To reverse the exclusion for a message, select the line from the grid and then remove the check from this field. Click the Add button to update the grid.

Grid Information

The grid displays statement messages that are assigned to this customer. For each message, the following information is displayed:

The date the message Expires

The message Code

The Message text

The Source of the assignment (Manual or Criteria)

Whether or not the message is Excluded (an asterisk indicates exclusion)

To select a message to maintain, double-click the line in the grid. Once you select a message line, you can use the Remove button if the message was manually assigned or the Exclude field if the message was assigned via Criteria selections.
