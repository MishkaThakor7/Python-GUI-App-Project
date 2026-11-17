import sys
from PyQt5.QtWidgets import QMainWindow, QApplication, QMessageBox, QTableWidgetItem
from PyQt5.QtCore import QDate, QTime, QTimer

from heritagelettings import Ui_MainWindow


class MyForm(QMainWindow):
    def __init__(self, parent=None):
        super().__init__()
        self.ui = Ui_MainWindow()
        self.ui.setupUi(self)

        #  Login credentials 
        self.valid_username = "demo"
        self.valid_password = "heritage123"
        self.ui.usernameLineEdit.setEchoMode(self.ui.usernameLineEdit.EchoMode.Normal)
        self.ui.passwordLineEdit.setEchoMode(self.ui.passwordLineEdit.EchoMode.Password)

        #  In-memory data storage 
        self.property_register = []
        self.viewing_bookings = []

        #  Page 0: Login Page Connections
        self.ui.stackedWidget.setCurrentWidget(self.ui.LoginPage)
        self.ui.loginButton.clicked.connect(self.attempt_login)
        self.ui.cancelButton.clicked.connect(self.wipe_login_fields)

        #  Page 1: Property Register Connections
        self.ui.calendarWidget.setMinimumDate(QDate.currentDate())
        self.ui.calendarWidget.setSelectedDate(QDate.currentDate())
        self.ui.calendarWidget.selectionChanged.connect(self.confirm_availability_date)
        self.ui.addButton.clicked.connect(self.jot_down_feature)
        self.ui.saveButton.clicked.connect(self.register_property)
        self.ui.clearButton.clicked.connect(self.start_new_listing)
        self.ui.nextButton.clicked.connect(self.head_to_enquiries_desk)

        #  Page 2: Tenant Bookings Connections
        self.ui.bookButton.clicked.connect(self.arrange_viewing)
        self.ui.backButton_2.clicked.connect(self.back_to_property_register)
        self.ui.nextButton_2.clicked.connect(self.open_dashboard)

        #  Page 3: Dashboard & Reports 
        self.clock_timer = QTimer(self)
        self.clock_timer.timeout.connect(self.tick_active_clock)
        self.clock_timer.start(1000)
        self.tick_active_clock()

        self.ui.savedPropertiesTable.setHorizontalHeaderLabels(
            ["Name", "Address", "Rent", "Grade"]
        )

        self.ui.exportReportButton.clicked.connect(self.compile_portfolio_report)
        self.ui.backButton.clicked.connect(self.back_to_enquiries_desk)
        self.ui.exitButton.clicked.connect(self.close)
        self.ui.dialEscalation.valueChanged.connect(self.reflect_escalation_choice)
        self.reflect_escalation_choice(self.ui.dialEscalation.value())

    def attempt_login(self):
        entered_username = self.ui.usernameLineEdit.text().strip()
        entered_password = self.ui.passwordLineEdit.text().strip()

        if entered_username.lower() == self.valid_username.lower() and entered_password == self.valid_password:
            self.ui.usernameLineEdit.clear()
            self.ui.passwordLineEdit.clear()
            QMessageBox.information(
                self,
                "Login Successful",
                "Welcome back! Login successful."
            )
            self.ui.stackedWidget.setCurrentWidget(self.ui.PropertyRegister)
        else:
            QMessageBox.warning(
                self,
                "Login Failed",
                "Incorrect username or password. Please try again."
            )
            self.ui.usernameLineEdit.clear()

    def wipe_login_fields(self):
        self.ui.usernameLineEdit.clear()
        self.ui.passwordLineEdit.clear()


    # Property Register (page 1) Functionality

    def confirm_availability_date(self):
        chosen_date = self.ui.calendarWidget.selectedDate().toString("dd MMMM yyyy")
        self.statusBar().showMessage(f"Available from: {chosen_date}", 4000)

    def jot_down_feature(self):
        new_feature = self.ui.newFeatureLineEdit.text().strip()

        if new_feature == "":
            QMessageBox.information(
                self,
                "No Feature Entered",
                "Type a heritage feature (e.g. 'Yellowwood floors') before adding it."
            )
            return

        self.ui.listFeatures.addItem(new_feature)
        self.ui.newFeatureLineEdit.clear()

    def register_property(self):
        property_name = self.ui.propertyNameLineEdit.text().strip()
        property_address = self.ui.addressLineEdit.text().strip()

        if property_name == "" or property_address == "":
            QMessageBox.warning(
                self,
                "Missing Information",
                "Please enter at least a property name and address before saving."
            )
            return

        standout_features = [
            self.ui.listFeatures.item(i).text()
            for i in range(self.ui.listFeatures.count())
        ]

        new_listing = {
            "name": property_name,
            "address": property_address,
            "heritage_grade": self.ui.heritageGradeComboBox.currentText(),
            "style": self.ui.styleComboBox.currentText(),
            "rent": self.ui.rentSpinBox.value(),
            "available_from": self.ui.calendarWidget.selectedDate().toString("dd MMMM yyyy"),
            "description": self.ui.descriptionText.toPlainText().strip(),
            "features": standout_features,
        }
        self.property_register.append(new_listing)

        # Keep the Dashboard's property count in sync as listings are saved
        self.ui.lcdTotalProperties.display(len(self.property_register))

        QMessageBox.information(
            self,
            "Property Saved",
            f"'{property_name}' has been added to the register."
        )
        self.start_new_listing()

    def start_new_listing(self):
        self.ui.propertyNameLineEdit.clear()
        self.ui.addressLineEdit.clear()
        self.ui.heritageGradeComboBox.setCurrentIndex(0)
        self.ui.styleComboBox.setCurrentIndex(0)
        self.ui.rentSpinBox.setValue(0)
        self.ui.descriptionText.clear()
        self.ui.newFeatureLineEdit.clear()
        self.ui.listFeatures.clear()

    def head_to_enquiries_desk(self):
        self.ui.stackedWidget.setCurrentWidget(self.ui.TenantEnquiries)


    # Tenant Enquiries (page 2) Functionality

    def arrange_viewing(self):
        prospective_tenant = self.ui.tenantName.text().strip()
        contact_details = self.ui.contact.text().strip()

        if prospective_tenant == "" or contact_details == "":
            QMessageBox.warning(
                self,
                "Missing Information",
                "Please enter at least a tenant name and contact detail before booking."
            )
            return

        # Which radio button in urgencyGroupBox is checked
        if self.ui.immediateButton.isChecked():
            move_in_urgency = "Immediate"
        elif self.ui.oneMonthButton.isChecked():
            move_in_urgency = "Within 1 Month"
        else:
            move_in_urgency = "Within 3 Months"

        # Which checkboxes in amenitiesGroupBox are ticked
        wishlist = []
        if self.ui.gardenCheckBox.isChecked():
            wishlist.append("Garden")
        if self.ui.parkingCheckBox.isChecked():
            wishlist.append("Parking")
        if self.ui.petFriendlyCheckBox.isChecked():
            wishlist.append("Pet-Friendly")
        if self.ui.furnishedCheckBox.isChecked():
            wishlist.append("Furnished")
        wishlist_text = ", ".join(wishlist) if wishlist else "None specified"

        appointment_time = self.ui.dateTimeEdit.dateTime().toString("dd MMM yyyy HH:mm")
        headcount = self.ui.occupantsSpinBox.value()

        new_booking = {
            "tenant_name": prospective_tenant,
            "contact": contact_details,
            "viewing_time": appointment_time,
            "occupants": headcount,
            "urgency": move_in_urgency,
            "amenities": wishlist_text,
        }
        self.viewing_bookings.append(new_booking)

        QMessageBox.information(
            self,
            "Viewing Booked",
            f"Viewing booked for {prospective_tenant} on {appointment_time}."
        )
        self.reset_enquiry_form()

    def reset_enquiry_form(self):
        self.ui.tenantName.clear()
        self.ui.contact.clear()
        self.ui.occupantsSpinBox.setValue(1)
        self.ui.oneMonthButton.setChecked(True)
        self.ui.gardenCheckBox.setChecked(False)
        self.ui.parkingCheckBox.setChecked(False)
        self.ui.petFriendlyCheckBox.setChecked(False)
        self.ui.furnishedCheckBox.setChecked(False)

    def back_to_property_register(self):
        self.ui.stackedWidget.setCurrentWidget(self.ui.PropertyRegister)


    # Dashboard & Reports (page 3) Functionality

    def tick_active_clock(self):
        self.ui.lcdActiveClock.display(QTime.currentTime().toString("HH:mm:ss"))

    def open_dashboard(self):
        self.refresh_portfolio_snapshot()
        self.ui.stackedWidget.setCurrentWidget(self.ui.DashboardReports)

    def refresh_portfolio_snapshot(self):
        # LCD: total properties currently on the books
        self.ui.lcdTotalProperties.display(len(self.property_register))

        # Progress bar: how much viewing interest the portfolio is drawing,
        # as a rough ratio of bookings to listings
        if self.property_register:
            viewing_interest = round(
                (len(self.viewing_bookings) / len(self.property_register)) * 100
            )
            viewing_interest = min(viewing_interest, 100)
        else:
            viewing_interest = 0
        self.ui.progressBarOccupancy.setValue(viewing_interest)

        # Table: list every saved property so far
        self.ui.savedPropertiesTable.setRowCount(0)
        for row_number, listing in enumerate(self.property_register):
            self.ui.savedPropertiesTable.insertRow(row_number)
            self.ui.savedPropertiesTable.setItem(row_number, 0, QTableWidgetItem(listing["name"]))
            self.ui.savedPropertiesTable.setItem(row_number, 1, QTableWidgetItem(listing["address"]))
            self.ui.savedPropertiesTable.setItem(row_number, 2, QTableWidgetItem(f"R{listing['rent']}"))
            self.ui.savedPropertiesTable.setItem(row_number, 3, QTableWidgetItem(listing["heritage_grade"]))

    def reflect_escalation_choice(self, chosen_value):
        self.ui.escalationValueLabel.setText(f"Escalation Value: {chosen_value}%")

    def compile_portfolio_report(self):
        # Plain text file export (no database) summarising current data
        with open("stonecroft_report.txt", "w") as report_file:
            report_file.write("STONECROFT HERITAGE LETTINGS - REPORT\n")
            report_file.write("=" * 40 + "\n\n")
            report_file.write(f"Total properties registered: {len(self.property_register)}\n")
            for listing in self.property_register:
                report_file.write(
                    f"  - {listing['name']} ({listing['address']}), "
                    f"{listing['heritage_grade']}, R{listing['rent']}\n"
                )
            report_file.write(f"\nTotal viewings booked: {len(self.viewing_bookings)}\n")
            for booking in self.viewing_bookings:
                report_file.write(
                    f"  - {booking['tenant_name']} on {booking['viewing_time']} "
                    f"({booking['urgency']})\n"
                )
            report_file.write(
                f"\nProjected rent escalation: {self.ui.dialEscalation.value()}%\n"
            )
            report_file.write(
                f"Viewing interest: {self.ui.progressBarOccupancy.value()}%\n"
            )

        QMessageBox.information(
            self,
            "Report Exported",
            "Report saved as stonecroft_report.txt in the application folder."
        )


    def back_to_enquiries_desk(self):
        self.ui.stackedWidget.setCurrentWidget(self.ui.TenantEnquiries)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    myapp = MyForm()
    myapp.show()
    sys.exit(app.exec_())
