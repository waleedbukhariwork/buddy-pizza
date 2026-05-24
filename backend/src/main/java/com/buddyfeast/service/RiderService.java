package com.buddyfeast.service;

import com.buddyfeast.entity.Rider;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RiderService {
    
    @Autowired
    private RiderRepository riderRepository;
    
    public List<Rider> getAllRiders() {
        return riderRepository.findAll();
    }
    
    public Rider getRiderById(Long id) {
        return riderRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rider not found"));
    }
    
    public Rider createRider(Rider rider) {
        return riderRepository.save(rider);
    }
    
    public Rider updateRider(Long id, Rider riderDetails) {
        Rider rider = riderRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rider not found"));
        
        rider.setPhone(riderDetails.getPhone());
        rider.setStatus(riderDetails.getStatus());
        rider.setRating(riderDetails.getRating());
        
        return riderRepository.save(rider);
    }
}
